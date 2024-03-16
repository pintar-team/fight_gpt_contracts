import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Fights contract", function() {
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

  beforeEach(async function() {
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

    // minting NFTs for players....
    await heroesGPT.connect(minter).safeMint(accounts[5].address, 1, "");
    await heroesGPT.connect(minter).safeMint(accounts[6].address, 2, "");
    await heroesGPT.connect(minter).safeMint(accounts[7].address, 3, "");
    await heroesGPT.connect(minter).safeMint(accounts[8].address, 4, "");

    // transfer ERC20 tokens for players...
    await token.transfer(accounts[5], 1000);
    await token.transfer(accounts[6], 1000);
    await token.transfer(accounts[7], 1000);
    await token.transfer(accounts[8], 1000);
  });

  describe("Fight contract testing", async function() {
    it("testing constructor", async function() {
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

    it("testing redistributeStakes", async function() {
      let amount0 = 100n;
      let amount1 = 3000n;
      let [potentialGain, platformFee, winnerGain] = await fight.redistributeStakes(amount0, amount1);

      expect(platformFee).to.equal(potentialGain * BigInt(fee) / 100n);
      expect(potentialGain).to.equal(Math.min(Number(amount0), Number(amount1)));
      expect(winnerGain).to.equal(potentialGain - platformFee);
    });

    it("test add and remove ", async function() {
      let player = accounts[8];
      let tokenid = 4;
      let stake = 500;
      let rounds = 3;

      // make approve tokens before call
      await heroesGPT.connect(player).approve(fight.target, tokenid);
      await token.connect(player).approve(fight.target, stake);
      await fight.connect(player).join(tokenid, stake, rounds);

      let newowner = await heroesGPT.ownerOf(tokenid);

      expect(newowner).to.equal(fight.target);

      await fight.connect(player).remove(tokenid);

      let realowner = await heroesGPT.ownerOf(tokenid);
      expect(realowner).to.equal(player.address);
    });

    it("test join", async function() {
      let player2 = accounts[6];
      let tokenid = 2;
      let stake = 230;
      let rounds = 3;

      // make approve tokens before call
      await heroesGPT.connect(player2).approve(fight.target, tokenid);
      await token.connect(player2).approve(fight.target, stake);
      await fight.connect(player2).join(tokenid, stake, rounds);

      const totalFights = await fight.total_fights();
      const fetchRounds = await fight.rounds(tokenid);
      const fetchStakes = await fight.stakes(tokenid);

      expect(totalFights).to.equal(0n);
      expect(fetchRounds).to.equal(rounds);
      expect(fetchStakes).to.equal(stake);
    });

    it("test lobby", async function() {
      let player0 = accounts[5];
      let player1 = accounts[6];
      let tokenid0 = 1;
      let stake0 = 130;
      let rounds0 = 1;

      let tokenid1 = 2;
      let stake1 = 100;
      let rounds1 = 10;

      // make approve tokens player 0
      await heroesGPT.connect(player0).approve(fight.target, tokenid0);
      await token.connect(player0).approve(fight.target, stake0);

      // make approve tokens player 1
      await heroesGPT.connect(player1).approve(fight.target, tokenid1);
      await token.connect(player1).approve(fight.target, stake1);

      // try join with tokens and stake...
      await fight.connect(player0).join(tokenid0, stake0, rounds0);
      await expect(fight.connect(player1).join(tokenid0, stake1, rounds1)).to.be.reverted;
      await fight.connect(player1).join(tokenid1, stake1, rounds1);

      const totalFights = await fight.total_fights();

      expect(totalFights).to.equal(1n);

      const fights = await fight.fights(totalFights);

      expect(fights[0]).to.equals(tokenid1);
      expect(fights[1]).to.equals(tokenid0);
    });

    it("test commit", async function() {
      let player1 = accounts[5];
      let player2 = accounts[7];
      let tokenid1 = 1;
      let stake1 = 500;
      let rounds1 = 3;

      let tokenid2 = 3;
      let stake2 = 500;
      let rounds2 = 10;

      // Server make chose who won.
      let tokens = [tokenid1, tokenid2];
      let randomIndex = Math.floor(Math.random() * tokens.length);
      let winner = tokens[randomIndex];
      let loser = winner == tokenid1 ? tokenid2 : tokenid1;

      // make approve tokens player 1
      await heroesGPT.connect(player1).approve(fight.target, tokenid1);
      await token.connect(player1).approve(fight.target, stake1);

      // make approve tokens player 2
      await heroesGPT.connect(player2).approve(fight.target, tokenid2);
      await token.connect(player2).approve(fight.target, stake2);

      // try join with tokens and stake...
      await fight.connect(player1).join(tokenid1, stake1, rounds1);
      await fight.connect(player2).join(tokenid2, stake2, rounds2);

      const fightid = await fight.total_fights();

      await fight.connect(wallet).commit(fightid, winner);

      const fetchRounds1 = await fight.rounds(tokenid1);
      const fetchRounds2 = await fight.rounds(tokenid2);

      expect(fetchRounds1).to.equals(2n);
      expect(fetchRounds2).to.equals(9n);

      const winnerStake = await fight.stakes(winner);
      const loserStake = await fight.stakes(loser);

      expect(winnerStake).to.equals(stake1 + (Math.min(stake1, stake1) - Math.min(stake1, stake2) * fee / 100));
      expect(loserStake).to.equals(stake2 - Math.min(stake1, stake1));

      const walletBalance = await token.balanceOf(wallet.address);

      expect(walletBalance).to.equals(Math.min(stake1, stake2) * fee / 100);
    });
  });
});
