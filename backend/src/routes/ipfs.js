'use strict';

const express = require('express');
const axios = require('axios');

const router = express.Router();

// ─── Encryption Helpers (XOR + Base64) ─────────────────────────────────────────
/**
 * XOR-encrypts a plaintext string using the key, then base64-encodes the result.
 * @param {string} text      - The plaintext to encrypt.
 * @param {string} key       - The encryption key.
 * @returns {string}         - Base64-encoded XOR-encrypted string.
 */
function encrypt(text, key) {
  if (!text || typeof text !== 'string') return text;
  const textBytes = Buffer.from(text, 'utf8');
  const keyBytes = Buffer.from(key, 'utf8');
  const encrypted = Buffer.alloc(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return encrypted.toString('base64');
}

/**
 * Decodes a base64 string and XOR-decrypts it using the key.
 * @param {string} encoded  - Base64-encoded XOR-encrypted string.
 * @param {string} key      - The encryption key.
 * @returns {string}        - The original plaintext.
 */
function decrypt(encoded, key) {
  if (!encoded || typeof encoded !== 'string') return encoded;
  const encryptedBytes = Buffer.from(encoded, 'base64');
  const keyBytes = Buffer.from(key, 'utf8');
  const decrypted = Buffer.alloc(encryptedBytes.length);

  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return decrypted.toString('utf8');
}

// ─── Pinata API Helper ──────────────────────────────────────────────────────────
function getPinataHeaders() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error('PINATA_JWT is not configured in environment variables.');
  }
  return {
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  };
}

// ─── POST /upload-prescription ──────────────────────────────────────────────────
/**
 * Accepts a JSON body with prescription data.
 * Encrypts sensitive fields (patientName, dob, notes) before uploading to Pinata.
 *
 * Request body shape (example):
 * {
 *   patientName: "John Doe",
 *   patientAddress: "0x...",
 *   dob: "1990-01-15",
 *   medicationName: "Amoxicillin",
 *   dosage: "500mg",
 *   frequency: "3x daily",
 *   duration: "7 days",
 *   refills: 0,
 *   notes: "Take with food",
 *   prescribedBy: "0x...",
 *   issuedAt: 1700000000
 * }
 *
 * Returns: { cid, ipfsUrl }
 */
router.post('/upload-prescription', async (req, res, next) => {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return res.status(500).json({
        status: 500,
        message: 'ENCRYPTION_KEY is not configured on the server.',
      });
    }

    const prescriptionData = req.body;

    if (!prescriptionData || Object.keys(prescriptionData).length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Request body must contain prescription data.',
      });
    }

    // Sensitive fields to encrypt
    const SENSITIVE_FIELDS = ['patientName', 'dob', 'notes'];

    // Build the payload – encrypt sensitive fields, keep the rest as-is
    const encryptedPayload = { ...prescriptionData };
    for (const field of SENSITIVE_FIELDS) {
      if (encryptedPayload[field] !== undefined && encryptedPayload[field] !== null) {
        encryptedPayload[field] = encrypt(String(encryptedPayload[field]), encryptionKey);
      }
    }

    // Mark the record so consumers know which fields are encrypted
    encryptedPayload._encryptedFields = SENSITIVE_FIELDS;
    encryptedPayload._version = '1.0';
    encryptedPayload._uploadedAt = new Date().toISOString();

    // Upload to Pinata
    const pinataPayload = {
      pinataContent: encryptedPayload,
      pinataMetadata: {
        name: `prescription-${prescriptionData.patientAddress || 'unknown'}-${Date.now()}`,
        keyvalues: {
          patientAddress: prescriptionData.patientAddress || '',
          prescribedBy: prescriptionData.prescribedBy || '',
          issuedAt: String(prescriptionData.issuedAt || ''),
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      pinataPayload,
      { headers: getPinataHeaders() }
    );

    const cid = response.data.IpfsHash;

    return res.status(201).json({
      status: 201,
      message: 'Prescription uploaded to IPFS successfully.',
      cid,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /fetch/:cid ────────────────────────────────────────────────────────────
/**
 * Fetches IPFS content from Pinata gateway by CID.
 * Automatically decrypts sensitive fields if ENCRYPTION_KEY is set.
 *
 * Returns the raw JSON content stored at the given CID.
 */
router.get('/fetch/:cid', async (req, res, next) => {
  try {
    const { cid } = req.params;

    if (!cid || cid.trim() === '') {
      return res.status(400).json({ status: 400, message: 'CID parameter is required.' });
    }

    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    const response = await axios.get(gatewayUrl, {
      timeout: 15000,
      headers: {
        Accept: 'application/json',
      },
    });

    let data = response.data;

    // Attempt to decrypt sensitive fields if ENCRYPTION_KEY is set
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey && data && Array.isArray(data._encryptedFields)) {
      const decryptedData = { ...data };
      for (const field of data._encryptedFields) {
        if (decryptedData[field] !== undefined && decryptedData[field] !== null) {
          try {
            decryptedData[field] = decrypt(String(decryptedData[field]), encryptionKey);
          } catch {
            // Leave the field encrypted if decryption fails
          }
        }
      }
      data = decryptedData;
    }

    return res.json({
      status: 200,
      cid,
      ipfsUrl: gatewayUrl,
      data,
    });
  } catch (err) {
    if (err.response) {
      // Axios HTTP error from gateway
      return res.status(err.response.status || 502).json({
        status: err.response.status || 502,
        message: `Failed to fetch from IPFS gateway: ${err.response.statusText || err.message}`,
      });
    }
    next(err);
  }
});

// ─── POST /upload-record ────────────────────────────────────────────────────────
/**
 * Accepts a JSON body with clinical history or general record data.
 * Encrypts sensitive fields specified in the body (or defaults) before uploading to Pinata.
 *
 * Request body shape:
 * {
 *   data: { ... },
 *   sensitiveFields: ["diagnosis", "notes", "patientName"] // optional
 * }
 */
router.post('/upload-record', async (req, res, next) => {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return res.status(500).json({
        status: 500,
        message: 'ENCRYPTION_KEY is not configured on the server.',
      });
    }

    const { data, sensitiveFields } = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Request body must contain a "data" object.',
      });
    }

    const defaultSensitiveFields = ['patientName', 'dob', 'notes', 'diagnosis', 'treatment', 'allergies', 'medications'];
    const fieldsToEncrypt = Array.isArray(sensitiveFields) ? sensitiveFields : defaultSensitiveFields;

    // Build the payload – encrypt sensitive fields, keep the rest as-is
    const encryptedPayload = { ...data };
    for (const field of fieldsToEncrypt) {
      if (encryptedPayload[field] !== undefined && encryptedPayload[field] !== null) {
        encryptedPayload[field] = encrypt(String(encryptedPayload[field]), encryptionKey);
      }
    }

    // Mark the record so consumers know which fields are encrypted
    encryptedPayload._encryptedFields = fieldsToEncrypt;
    encryptedPayload._version = '1.0';
    encryptedPayload._uploadedAt = new Date().toISOString();

    // Upload to Pinata
    const pinataPayload = {
      pinataContent: encryptedPayload,
      pinataMetadata: {
        name: `record-${data.patientAddress || 'unknown'}-${Date.now()}`,
        keyvalues: {
          patientAddress: data.patientAddress || '',
          addedBy: data.addedBy || '',
          recordType: data.recordType || '',
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      pinataPayload,
      { headers: getPinataHeaders() }
    );

    const cid = response.data.IpfsHash;

    return res.status(201).json({
      status: 201,
      message: 'Record uploaded to IPFS successfully.',
      cid,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
