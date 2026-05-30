// scripts/deploy.js
'use strict';

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log('\n🚀  MediPass Contract Deployment');
  console.log('================================');
  console.log(`📬  Deployer address : ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰  Deployer balance : ${hre.ethers.formatEther(balance)} MON\n`);

  if (balance === 0n) {
    console.error('❌  Deployer wallet has no balance. Fund it with testnet MON first.');
    process.exit(1);
  }

  // ─── 1. Deploy MediPassRoles ────────────────────────────────────────────────
  console.log('📄  Deploying MediPassRoles...');
  const MediPassRoles = await hre.ethers.getContractFactory('MediPassRoles');
  const roles = await MediPassRoles.deploy();
  await roles.waitForDeployment();
  const rolesAddress = await roles.getAddress();
  console.log(`✅  MediPassRoles deployed at : ${rolesAddress}`);

  // ─── 2. Deploy MediPassPrescription ────────────────────────────────────────
  console.log('\n📄  Deploying MediPassPrescription...');
  const MediPassPrescription = await hre.ethers.getContractFactory('MediPassPrescription');
  const prescription = await MediPassPrescription.deploy(rolesAddress);
  await prescription.waitForDeployment();
  const prescriptionAddress = await prescription.getAddress();
  console.log(`✅  MediPassPrescription deployed at : ${prescriptionAddress}`);

  // ─── 3. Print .env snippet ─────────────────────────────────────────────────
  console.log('\n================================');
  console.log('📋  Copy these into backend/.env');
  console.log('================================');
  console.log(`CONTRACT_ROLES_ADDRESS=${rolesAddress}`);
  console.log(`CONTRACT_PRESCRIPTION_ADDRESS=${prescriptionAddress}`);
  console.log('================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
