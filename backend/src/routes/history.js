'use strict';

const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

// ─── ABI (MediPassClinicalHistory) ───────────────────────────────────────────
const HISTORY_ABI = [
  // Write
  'function updateClinicalHistory(string calldata ipfsCID) external',
  'function addRecord(address patient, string calldata ipfsCID, string calldata recordType) external',
  // Read
  'function getClinicalHistory(address patient) external view returns (string memory)',
  'function getRecords(address patient) external view returns (tuple(address addedBy, string ipfsCID, uint256 timestamp, string recordType)[])',
];

// ─── Contract Factories ──────────────────────────────────────────────────────
function getReadContract() {
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const address = process.env.CONTRACT_CLINICAL_HISTORY_ADDRESS;

  if (!address) {
    throw Object.assign(
      new Error('CONTRACT_CLINICAL_HISTORY_ADDRESS is not set in environment variables.'),
      { statusCode: 503 }
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(address, HISTORY_ABI, provider);
}

function getWriteContract() {
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const address = process.env.CONTRACT_CLINICAL_HISTORY_ADDRESS;
  const privateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!address) {
    throw Object.assign(
      new Error('CONTRACT_CLINICAL_HISTORY_ADDRESS is not set in environment variables.'),
      { statusCode: 503 }
    );
  }
  if (!privateKey) {
    throw Object.assign(
      new Error('ADMIN_PRIVATE_KEY is not set in environment variables.'),
      { statusCode: 503 }
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(address, HISTORY_ABI, signer);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function validateAddress(address, fieldName = 'address') {
  if (!address || !ethers.isAddress(address)) {
    const err = new Error(`Invalid or missing ${fieldName}: "${address}"`);
    err.statusCode = 400;
    throw err;
  }
}

function formatRecord(raw) {
  return {
    addedBy:    raw.addedBy,
    ipfsCID:    raw.ipfsCID,
    timestamp:  Number(raw.timestamp),
    recordType: raw.recordType,
  };
}

// ─── GET /api/history/:address ──────────────────────────────────────────────
/**
 * Retrieve the patient's overall clinical history IPFS CID.
 */
router.get('/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    validateAddress(address, 'patient address');

    const contract = getReadContract();
    const cid = await contract.getClinicalHistory(address);

    res.json({
      status: 200,
      patientAddress: address,
      clinicalHistoryCID: cid || null,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/history/update ────────────────────────────────────────────────
/**
 * Updates the patient's overall clinical history document CID.
 * Caller's wallet (ADMIN_PRIVATE_KEY) must be the patient.
 *
 * Body:
 * {
 *   ipfsCID: "bafyrei..."
 * }
 */
router.post('/update', async (req, res, next) => {
  try {
    const { ipfsCID } = req.body;

    if (!ipfsCID || typeof ipfsCID !== 'string' || ipfsCID.trim() === '') {
      return res.status(400).json({ status: 400, message: 'ipfsCID is required.' });
    }

    const contract = getWriteContract();
    const tx = await contract.updateClinicalHistory(ipfsCID.trim());
    const receipt = await tx.wait();

    res.status(200).json({
      status: 200,
      message: 'Overall clinical history CID updated successfully on-chain.',
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/history/records/add ───────────────────────────────────────────
/**
 * Adds an individual verifiable medical entry to the patient's history.
 *
 * Body:
 * {
 *   patient: "0x...",
 *   ipfsCID: "bafyrei...",
 *   recordType: "Consultation" // e.g. Vaccination, Lab Result, Consultation
 * }
 */
router.post('/records/add', async (req, res, next) => {
  try {
    const { patient, ipfsCID, recordType } = req.body;

    validateAddress(patient, 'patient');

    if (!ipfsCID || typeof ipfsCID !== 'string' || ipfsCID.trim() === '') {
      return res.status(400).json({ status: 400, message: 'ipfsCID is required.' });
    }
    if (!recordType || typeof recordType !== 'string' || recordType.trim() === '') {
      return res.status(400).json({ status: 400, message: 'recordType is required.' });
    }

    const contract = getWriteContract();
    const tx = await contract.addRecord(
      patient.trim(),
      ipfsCID.trim(),
      recordType.trim()
    );
    const receipt = await tx.wait();

    res.status(201).json({
      status: 201,
      message: 'Verifiable clinical record added successfully on-chain.',
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/history/records/:address ───────────────────────────────────────
/**
 * Retrieve all verifiable timeline records for a patient.
 */
router.get('/records/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    validateAddress(address, 'patient address');

    const contract = getReadContract();
    const rawRecords = await contract.getRecords(address);
    const records = rawRecords.map(formatRecord);

    res.json({
      status: 200,
      patientAddress: address,
      count: records.length,
      records,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
