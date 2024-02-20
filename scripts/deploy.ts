import { ethers } from "hardhat";

const FIGHTS_FEE = 1; // 1%

async function main() {
  const [deployer] = await ethers.getSigners();
  const server = process.env.SERVER_ADDRESS || '0xD67d3B191EDDE0B4fC6dF994E0DEf522cDF9275c';

  if (!ethers.isAddress(server)) {
    throw new Error("Invalid server address");
  }

  console.log('account:', deployer.address);
  console.log('server:', server);

  console.log("Deploying HeroesGPT contracts");
  const HeroesGPT = await ethers.getContractFactory("HeroesGPT");
  const char = await HeroesGPT.deploy();
  console.log("HeroesGPT address:", char.target);

  console.log("ERC20 Token contracts");
  const ERC20Token = await ethers.getContractFactory("ERC20Token");
  const token = await ERC20Token.deploy();
  console.log("ERC20 Token address:", token.target);

  console.log("Deploying CrowdSale contracts");
  const CrowdSale = await ethers.getContractFactory("CrowdSale");
  const crowdSale = await CrowdSale.deploy(server, char.target, server);
  console.log("CrowdSale address:", crowdSale.target);

  console.log("Deploying Item contracts");
  const Item = await ethers.getContractFactory("Item");
  const item = await Item.deploy();
  console.log("Item address:", item.target);

  console.log("Deploying Effect contracts");
  const Effect = await ethers.getContractFactory("Effect");
  const effect = await Effect.deploy(item.target, char.target);
  console.log("Effect address:", effect.target);

  console.log("Deploying Fight contracts, use fee", FIGHTS_FEE);
  const Fight = await ethers.getContractFactory("Fight");
  const fight = await Fight.deploy(
    FIGHTS_FEE,
    effect.target,
    char.target,
    token.target
  );
  console.log("Fight address:", fight.target);

  console.log('grant Role Minter for crowdSale');
  const role = await char.MINTER_ROLE();

  await char.grantRole(role, crowdSale.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
