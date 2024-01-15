import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Contract = await ethers.getContractFactory("HeroesGPT");
  const contract = await Contract.deploy();

  console.log("Contract deployed to address:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
