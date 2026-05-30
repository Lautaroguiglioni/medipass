'use strict';

const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

// ─── ABI (MediPassRoles) ────────────────────────────────────────────────────
const ROLES_ABI = [
  // Grant
  'function grantDoctor(address account) external',
  'function grantPharmacist(address account) external',
  'function grantPatient(address account) external',
  // Revoke
  'function revokeDoctor(address account) external',
  'function revokePharmacist(address account) external',
  // Query
  'function isDoctor(address account) external view returns (bool)',
  'function isPharmacist(address account) external view returns (bool)',
  'function isPatient(address account) external view returns (bool)',
  'function isAdmin(address account) external view returns (bool)',
  'function getDoctors() external view returns (address[])',
  'function getPharmacists() external view returns (address[])',
];

// ─── Contract Factory ───────────────────────────────────────────────────────
/**
 * Returns a read-only contract instance (JsonRpcProvider).
 */
function getReadContract() {
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const address = process.env.CONTRACT_ROLES_ADDRESS;

  if (!address) {
    throw Object.assign(new Error('CONTRACT_ROLES_ADDRESS is not set in environment variables.'), {
      statusCode: 503,
    });
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(address, ROLES_ABI, provider);
}

/**
 * Returns a signer-backed contract instance using ADMIN_PRIVATE_KEY.
 * Required for state-changing calls (grant / revoke).
 */
function getWriteContract() {
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const address = process.env.CONTRACT_ROLES_ADDRESS;
  const privateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!address) {
    throw Object.assign(new Error('CONTRACT_ROLES_ADDRESS is not set in environment variables.'), {
      statusCode: 503,
    });
  }
  if (!privateKey) {
    throw Object.assign(new Error('ADMIN_PRIVATE_KEY is not set in environment variables.'), {
      statusCode: 503,
    });
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(address, ROLES_ABI, signer);
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function validateAddress(address, fieldName = 'address') {
  if (!address || !ethers.isAddress(address)) {
    const err = new Error(`Invalid or missing ${fieldName}: "${address}"`);
    err.statusCode = 400;
    throw err;
  }
}

// ─── GET /api/roles/doctors ─────────────────────────────────────────────────
/**
 * Returns all addresses with DOCTOR_ROLE.
 */
router.get('/doctors', async (req, res, next) => {
  try {
    const contract = getReadContract();
    const doctors = await contract.getDoctors();

    res.json({
      status: 200,
      count: doctors.length,
      doctors,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/roles/pharmacists ─────────────────────────────────────────────
/**
 * Returns all addresses with PHARMACIST_ROLE.
 */
router.get('/pharmacists', async (req, res, next) => {
  try {
    const contract = getReadContract();
    const pharmacists = await contract.getPharmacists();

    res.json({
      status: 200,
      count: pharmacists.length,
      pharmacists,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/roles/check/:address ──────────────────────────────────────────
/**
 * Returns all roles held by a given address.
 *
 * Response:
 * {
 *   address: "0x...",
 *   roles: { isAdmin, isDoctor, isPharmacist, isPatient }
 * }
 */
router.get('/check/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    validateAddress(address);

    const contract = getReadContract();

    const [isAdmin, isDoctor, isPharmacist, isPatient] = await Promise.all([
      contract.isAdmin(address),
      contract.isDoctor(address),
      contract.isPharmacist(address),
      contract.isPatient(address),
    ]);

    res.json({
      status: 200,
      address,
      roles: { isAdmin, isDoctor, isPharmacist, isPatient },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/roles/grant/doctor ───────────────────────────────────────────
/**
 * Grants DOCTOR_ROLE to an address.
 * Body: { account: "0x..." }
 */
router.post('/grant/doctor', async (req, res, next) => {
  try {
    const { account } = req.body;
    validateAddress(account, 'account');

    const contract = getWriteContract();
    const tx = await contract.grantDoctor(account);
    const receipt = await tx.wait();

    res.status(201).json({
      status: 201,
      message: `DOCTOR_ROLE granted to ${account}`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/roles/grant/pharmacist ───────────────────────────────────────
/**
 * Grants PHARMACIST_ROLE to an address.
 * Body: { account: "0x..." }
 */
router.post('/grant/pharmacist', async (req, res, next) => {
  try {
    const { account } = req.body;
    validateAddress(account, 'account');

    const contract = getWriteContract();
    const tx = await contract.grantPharmacist(account);
    const receipt = await tx.wait();

    res.status(201).json({
      status: 201,
      message: `PHARMACIST_ROLE granted to ${account}`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/roles/grant/patient ──────────────────────────────────────────
/**
 * Grants PATIENT_ROLE to an address.
 * Body: { account: "0x..." }
 */
router.post('/grant/patient', async (req, res, next) => {
  try {
    const { account } = req.body;
    validateAddress(account, 'account');

    const contract = getWriteContract();
    const tx = await contract.grantPatient(account);
    const receipt = await tx.wait();

    res.status(201).json({
      status: 201,
      message: `PATIENT_ROLE granted to ${account}`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/roles/revoke/doctor ──────────────────────────────────────────
/**
 * Revokes DOCTOR_ROLE from an address.
 * Body: { account: "0x..." }
 */
router.post('/revoke/doctor', async (req, res, next) => {
  try {
    const { account } = req.body;
    validateAddress(account, 'account');

    const contract = getWriteContract();
    const tx = await contract.revokeDoctor(account);
    const receipt = await tx.wait();

    res.json({
      status: 200,
      message: `DOCTOR_ROLE revoked from ${account}`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/roles/revoke/pharmacist ──────────────────────────────────────
/**
 * Revokes PHARMACIST_ROLE from an address.
 * Body: { account: "0x..." }
 */
router.post('/revoke/pharmacist', async (req, res, next) => {
  try {
    const { account } = req.body;
    validateAddress(account, 'account');

    const contract = getWriteContract();
    const tx = await contract.revokePharmacist(account);
    const receipt = await tx.wait();

    res.json({
      status: 200,
      message: `PHARMACIST_ROLE revoked from ${account}`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
