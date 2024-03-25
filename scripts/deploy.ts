import { ethers } from "hardhat";

const FIGHTS_FEE = 1; // 1%

const TestTokenHolders = [
  '0xBC497c059F4E0bA1146c36a646924d6384039D0E',
  '0xA07EdBA943581E2352E9Cb369218B47A04dC4436',
  '0x47F916593b684B712a6099135aD6013d288507ca'
];


async function main() {
  const [deployer] = await ethers.getSigners();
  const server = process.env.SERVER_ADDRESS || '0xe3695975bD1A2Ebf40FA600FedAF5e4Db1b88f5f';

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
    server,
    FIGHTS_FEE,
    effect.target,
    char.target,
    token.target
  );
  console.log("Fight address:", fight.target);

  console.log('grant Role Minter for crowdSale');
  const role = await char.MINTER_ROLE();

  await char.grantRole(role, crowdSale.target);

  //Transfer tokens to test holders for testing (decimals = 18), transer 1 token. total 42
  for (let i = 0; i < TestTokenHolders.length; i++) {
    console.log('transfer token to', TestTokenHolders[i]);
    await token.transfer(TestTokenHolders[i], '1000000000000000000');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
