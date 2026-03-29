import pkg from 'hardhat';
const { ethers } = pkg;
import fs from 'fs';

async function main() {
  console.log("Deploying TrustLoanLite contract...");

  const TrustLoanLite = await ethers.getContractFactory("TrustLoanLite");
  const trustLoanLite = await TrustLoanLite.deploy();

  await trustLoanLite.waitForDeployment();

  const address = await trustLoanLite.getAddress();
  console.log("TrustLoanLite deployed to:", address);
  
  // Save deployment info
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('deployed.txt', JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
