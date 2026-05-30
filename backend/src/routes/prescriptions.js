'use strict';

const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

// ─── ABI (MediPassPrescription) ──────────────────────────────────────────────
const PRESCRIPTION_ABI = [
  // Write
  'function issuePrescription(address patient, string calldata ipfsCID, string calldata medicationName, uint256 dosageMg, uint256 refillsAllowed, uint256 expiresAt) external returns (uint256 tokenId)',
  'function dispensePrescription(uint256 tokenId) external',
  'function revokePrescription(uint256 tokenId) external',
  // Read
  'function getPrescription(uint256 tokenId) external view returns (tuple(uint256 tokenId, address patient, address doctor, string ipfsCID, string medicationName, uint256 dosageMg, uint256 refillsAllowed, uint256 refillsUsed, bool isActive, bool isDispensed, uint256 issuedAt, uint256 expiresAt))',
  'function getPatientPrescriptions(address patient) external view returns (uint256[])',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  // Events
  'event PrescriptionIssued(uint256 indexed tokenId, address indexed patient, address indexed doctor, string medicationName, uint256 expiresAt)',
  'event PrescriptionDispensed(uint256 indexed tokenId, address indexed pharmacist, uint256 refillsUsed, uint256 refillsAllowed)',
  'event PrescriptionRevoked(uint256 indexed tokenId, address indexed revokedBy)',
];

// ─── Contract Factories ──────────────────────────────────────────────────────
function getReadContract() {
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const address = process.env.CONTRACT_PRESCRIPTION_ADDRESS;

  if (!address) {
    throw Object.assign(
      new Error('CONTRACT_PRESCRIPTION_ADDRESS is not set in environment variables.'),
      { statusCode: 503 }
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(address, PRESCRIPTION_ABI, provider);
}

function getWriteContract() {
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const address = process.env.CONTRACT_PRESCRIPTION_ADDRESS;
  const privateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!address) {
    throw Object.assign(
      new Error('CONTRACT_PRESCRIPTION_ADDRESS is not set in environment variables.'),
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
  return new ethers.Contract(address, PRESCRIPTION_ABI, signer);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function validateAddress(address, fieldName = 'address') {
  if (!address || !ethers.isAddress(address)) {
    const err = new Error(`Invalid or missing ${fieldName}: "${address}"`);
    err.statusCode = 400;
    throw err;
  }
}

function validateTokenId(tokenId) {
  const id = Number(tokenId);
  if (!tokenId || isNaN(id) || id < 1) {
    const err = new Error(`Invalid tokenId: "${tokenId}". Must be a positive integer.`);
    err.statusCode = 400;
    throw err;
  }
  return id;
}

/**
 * Serialises a Prescription struct (returned as an array by ethers) into a
 * plain object with named keys and BigInt converted to strings/numbers.
 */
function formatPrescription(raw) {
  return {
    tokenId:        raw.tokenId.toString(),
    patient:        raw.patient,
    doctor:         raw.doctor,
    ipfsCID:        raw.ipfsCID,
    medicationName: raw.medicationName,
    dosageMg:       raw.dosageMg.toString(),
    refillsAllowed: Number(raw.refillsAllowed),
    refillsUsed:    Number(raw.refillsUsed),
    isActive:       raw.isActive,
    isDispensed:    raw.isDispensed,
    issuedAt:       Number(raw.issuedAt),
    expiresAt:      Number(raw.expiresAt),
  };
}

// ─── GET /api/prescriptions/:id ──────────────────────────────────────────────
/**
 * Fetch a single prescription by token ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tokenId = validateTokenId(req.params.id);
    const contract = getReadContract();

    const raw = await contract.getPrescription(tokenId);
    const prescription = formatPrescription(raw);

    res.json({
      status: 200,
      prescription,
    });
  } catch (err) {
    // Surface on-chain revert messages clearly
    if (err.code === 'CALL_EXCEPTION') {
      return res.status(404).json({
        status: 404,
        message: `Prescription #${req.params.id} does not exist.`,
      });
    }
    next(err);
  }
});

// ─── GET /api/prescriptions/patient/:address ─────────────────────────────────
/**
 * Returns all token IDs belonging to a patient address.
 */
router.get('/patient/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    validateAddress(address, 'patient address');

    const contract = getReadContract();
    const tokenIds = await contract.getPatientPrescriptions(address);

    res.json({
      status: 200,
      patient: address,
      count: tokenIds.length,
      tokenIds: tokenIds.map((id) => id.toString()),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/prescriptions/issue ───────────────────────────────────────────
/**
 * Issues a new prescription on-chain. Caller must be a doctor (enforced by
 * the contract via ADMIN_PRIVATE_KEY being a registered doctor).
 *
 * Body:
 * {
 *   patient:        "0x...",
 *   ipfsCID:        "bafyrei...",
 *   medicationName: "Amoxicillin",
 *   dosageMg:       500,
 *   refillsAllowed: 2,
 *   expiresAt:      1700000000   // unix timestamp
 * }
 */
router.post('/issue', async (req, res, next) => {
  try {
    const { patient, ipfsCID, medicationName, dosageMg, refillsAllowed, expiresAt } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    validateAddress(patient, 'patient');

    if (!ipfsCID || typeof ipfsCID !== 'string' || ipfsCID.trim() === '') {
      return res.status(400).json({ status: 400, message: 'ipfsCID is required.' });
    }
    if (!medicationName || typeof medicationName !== 'string' || medicationName.trim() === '') {
      return res.status(400).json({ status: 400, message: 'medicationName is required.' });
    }
    if (dosageMg === undefined || isNaN(Number(dosageMg)) || Number(dosageMg) < 0) {
      return res.status(400).json({ status: 400, message: 'dosageMg must be a non-negative number.' });
    }
    if (refillsAllowed === undefined || isNaN(Number(refillsAllowed)) || Number(refillsAllowed) < 0) {
      return res.status(400).json({ status: 400, message: 'refillsAllowed must be a non-negative integer.' });
    }
    if (!expiresAt || isNaN(Number(expiresAt)) || Number(expiresAt) <= Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ status: 400, message: 'expiresAt must be a future unix timestamp.' });
    }

    // ── Send TX ───────────────────────────────────────────────────────────────
    const contract = getWriteContract();

    const tx = await contract.issuePrescription(
      patient,
      ipfsCID.trim(),
      medicationName.trim(),
      BigInt(Math.round(Number(dosageMg))),
      BigInt(Math.round(Number(refillsAllowed))),
      BigInt(Math.round(Number(expiresAt)))
    );

    const receipt = await tx.wait();

    // ── Extract tokenId from PrescriptionIssued event ─────────────────────────
    const iface = new ethers.Interface(PRESCRIPTION_ABI);
    let tokenId = null;

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'PrescriptionIssued') {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch {
        // not a matching log — skip
      }
    }

    res.status(201).json({
      status: 201,
      message: 'Prescription issued successfully.',
      tokenId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    if (err.code === 'CALL_EXCEPTION') {
      return res.status(403).json({
        status: 403,
        message: `Transaction reverted: ${err.reason || err.message}`,
      });
    }
    next(err);
  }
});

// ─── POST /api/prescriptions/:id/dispense ────────────────────────────────────
/**
 * Marks a prescription as dispensed (or uses a refill). Caller must be a
 * pharmacist (enforced on-chain).
 */
router.post('/:id/dispense', async (req, res, next) => {
  try {
    const tokenId = validateTokenId(req.params.id);
    const contract = getWriteContract();

    const tx = await contract.dispensePrescription(tokenId);
    const receipt = await tx.wait();

    res.json({
      status: 200,
      message: `Prescription #${tokenId} dispensed successfully.`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    if (err.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        status: 400,
        message: `Transaction reverted: ${err.reason || err.message}`,
      });
    }
    next(err);
  }
});

// ─── POST /api/prescriptions/:id/revoke ──────────────────────────────────────
/**
 * Revokes (deactivates) a prescription. Caller must be the issuing doctor or
 * an admin (enforced on-chain).
 */
router.post('/:id/revoke', async (req, res, next) => {
  try {
    const tokenId = validateTokenId(req.params.id);
    const contract = getWriteContract();

    const tx = await contract.revokePrescription(tokenId);
    const receipt = await tx.wait();

    res.json({
      status: 200,
      message: `Prescription #${tokenId} revoked successfully.`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    if (err.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        status: 400,
        message: `Transaction reverted: ${err.reason || err.message}`,
      });
    }
    next(err);
  }
});

module.exports = router;
