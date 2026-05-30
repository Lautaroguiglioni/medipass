// scripts/deploy_history.js
'use strict';

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const rolesAddress = "0x60e0D8dF5F8E8592aDDD7D4cfB2C658b57Ea991d";

  console.log('\n🚀  MediPass Clinical History Deployment');
  console.log('========================================');
  console.log(`📬  Deployer address : ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰  Deployer balance : ${hre.ethers.formatEther(balance)} MON\n`);

  console.log(`📄  Deploying MediPassClinicalHistory linked to roles at ${rolesAddress}...`);
  const MediPassClinicalHistory = await hre.ethers.getContractFactory('MediPassClinicalHistory');
  const history = await MediPassClinicalHistory.deploy(rolesAddress);
  await history.waitForDeployment();
  const historyAddress = await history.getAddress();
  
  console.log(`✅  MediPassClinicalHistory deployed at : ${historyAddress}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
