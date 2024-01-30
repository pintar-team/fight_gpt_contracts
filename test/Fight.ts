import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CrowdSale contract", function () {
    let HeroesGPT: any;
    let heroesGPT: any;
    let ERC20Token: any;
    let token: any;
    let Effect: any;
    let effect: any;
    let Item: any;
    let item: any;
    let Fight: any;
    let fight: any;

    let serverSign: HardhatEthersSigner;
    let wallet: HardhatEthersSigner;
    let minter: HardhatEthersSigner;
    let accounts: HardhatEthersSigner[];

    let fee = 1; // 1%

    beforeEach(async function () {
        [serverSign, wallet, minter, ...accounts] = await ethers.getSigners();

        Item = await ethers.getContractFactory("Item");
        Effect = await ethers.getContractFactory("Effect");
        HeroesGPT = await ethers.getContractFactory("HeroesGPT");
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        Fight = await ethers.getContractFactory("Fight");

        item = await Item.deploy();
        heroesGPT = await HeroesGPT.deploy();
        token = await ERC20Token.deploy();
        effect = await Effect.deploy(item.target, heroesGPT.target);

        accounts = await ethers.getSigners();
        fight = await Fight.deploy(
          wallet,
          serverSign.address,
          fee,
          effect.target,
          heroesGPT.target,
          token.target
        );

        const nftRole = await heroesGPT.MINTER_ROLE();
        await heroesGPT.grantRole(nftRole, minter.address);
    });

    describe("Fight contract testing", async function() {
        it("test fight 2 tokens", async function () {
          let user0 = accounts[3];
          let user1 = accounts[4];

          await token.transfer(user0, 1400000000000n);
          await token.transfer(user1, 1400000000000n);
        });
    });
});