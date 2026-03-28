const hre = require("hardhat");

async function main() {
  console.log("Deploying TrustLoan contract...");
  
  const TrustLoan = await hre.ethers.getContractFactory("TrustLoan");
  const trustLoan = await TrustLoan.deploy();
  
  await trustLoan.waitForDeployment();
  console.log(`TrustLoan deployed to: ${trustLoan.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
