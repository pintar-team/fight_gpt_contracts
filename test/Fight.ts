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

        it("testing redistributeStakes", async function () {
          let amount0 = 100n;
          let amount1 = 3000n;
          let [potentialGain, platformFee, winnerGain] = await fight.redistributeStakes(amount0, amount1);

          expect(platformFee).to.equal(potentialGain * BigInt(fee) / 100n);
          expect(potentialGain).to.equal(Math.min(Number(amount0), Number(amount1)));
          expect(winnerGain).to.equal(potentialGain - platformFee);
        });

        it("test join", async function () {
          let tokenid = 2;
          let stake = 230;
          let rounds = 3;

          await fight.join(tokenid, stake, rounds);
          const totalFights = await fight.total_fights();
          const fetchRounds = await fight.rounds(tokenid);
          const fetchStakes = await fight.stakes(tokenid);

          expect(totalFights).to.equal(0n);
          expect(fetchRounds).to.equal(rounds);
          expect(fetchStakes).to.equal(stake);
        });

        it("test lobby", async function () {
          let tokenid0 = 4;
          let stake0 = 130;
          let rounds0 = 1;

          let tokenid1 = 3;
          let stake1 = 30;
          let rounds1 = 10;

          await fight.join(tokenid0, stake0, rounds0);
          await fight.join(tokenid1, stake1, rounds1);

          const totalFights = await fight.total_fights();

          expect(totalFights).to.equal(1n);

          const fights = await fight.fights(totalFights);

          expect(fights[0]).to.equals(tokenid1);
          expect(fights[1]).to.equals(tokenid0);
        });
        
        it("test commit", async function () {
          let tokenid0 = 2;
          let stake0 = 500;
          let rounds0 = 3;

          let tokenid1 = 3;
          let stake1 = 1000;
          let rounds1 = 2;

          await fight.join(tokenid0, stake0, rounds0);
          await fight.join(tokenid1, stake1, rounds1);

          const fightid = await fight.total_fights();

          await fight.commit(fightid, tokenid0);

          const fetchRounds0 = await fight.rounds(tokenid0);
          const fetchStakes0 = await fight.stakes(tokenid0);
          const fetchRounds1 = await fight.rounds(tokenid1);
          const fetchStakes1 = await fight.stakes(tokenid1);

          expect(fetchStakes0).to.equals(stake0 + (Math.min(stake0, stake1) - Math.min(stake0, stake1) * fee / 100));
          expect(fetchStakes1).to.equals(stake1 - Math.min(stake0, stake1));

          expect(fetchRounds0).to.equals(2n);
          expect(fetchRounds1).to.equals(1n);
        });
    });
});