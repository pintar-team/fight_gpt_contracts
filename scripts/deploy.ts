import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const server = process.env.SERVER_ADDRESS || '0xD67d3B191EDDE0B4fC6dF994E0DEf522cDF9275c';

  if (!ethers.isAddress(server)) {
    throw new Error("Invalid server address");
  }

  console.log("Deploying HeroesGPT contracts with the account:", deployer.address);

  const HeroesGPT = await ethers.getContractFactory("HeroesGPT");
  const char = await HeroesGPT.deploy();
  const CrowdSale = await ethers.getContractFactory("CrowdSale");
  const crowdSale = await CrowdSale.deploy(server, char.target, '0xD67d3B191EDDE0B4fC6dF994E0DEf522cDF9275c');

  console.log('grant Role Minter for crowdSale');
  const role = await char.MINTER_ROLE();

  await char.grantRole(role, crowdSale.target);

  console.log("HeroesGPT:", char.target);
  console.log("CrowdSale:", crowdSale.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
