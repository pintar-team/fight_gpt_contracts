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
          // wallet,
          // serverSign.address,
          fee,
          effect.target,
          heroesGPT.target,
          token.target
        );

        const nftRole = await heroesGPT.MINTER_ROLE();
        await heroesGPT.grantRole(nftRole, minter.address);
    });

    describe("Fight contract testing", async function() {
        it("testing constructor", async function () {
          let contractFee = await fight.fee();
          // let contractServer = await fight.server_address();
          let totalFights = await fight.total_fights();
          let contractEffects = await fight.contract_effects();
          let contractChar = await fight.contract_char_token();
          let contractToken = await fight.contract_token();

          expect(Number(contractFee)).to.equal(fee);
          expect(Number(totalFights)).to.equal(0);
          // expect(String(contractServer)).to.equal(serverSign.address);
          expect(String(contractEffects)).to.equal(effect.target);
          expect(String(contractChar)).to.equal(heroesGPT.target);
          expect(String(contractToken)).to.equal(token.target);
        });

        it("testing calc commision", async function () {
          let amount0 = 100n;
          let amount1 = 3000n;
          let [potentialGain, platformFee, winnerGain] = await fight.redistributeStakes(amount0, amount1);

          expect(platformFee).to.equal(potentialGain * BigInt(fee) / 100n);
          expect(potentialGain).to.equal(Math.min(Number(amount0), Number(amount1)));
          expect(winnerGain).to.equal(potentialGain - platformFee);
        });

        // it("test fight 2 tokens", async function () {
        //   let user0 = accounts[3];
        //   let user1 = accounts[4];

        //   await token.transfer(user0, 1400000000000n);
        //   await token.transfer(user1, 1400000000000n);
        // });
    });
});