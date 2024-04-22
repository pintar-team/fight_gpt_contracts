import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

describe("TokenPreSale", function() {
  let tokenPreSale: any;
  let token: any;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addresses: HardhatEthersSigner[];

  let targetMaximum = 0n;
  const tokenPrice = 7500000n;
  const targetMinimum = 0;
  const cooldownPeriod = 240;
  const deadline = 40320;

  beforeEach(async function() {
    [owner, addr1, addr2, ...addresses] = await ethers.getSigners();

    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    const TokenPreSale = await ethers.getContractFactory("TokenPreSale");

    token = await ERC20Token.deploy();

    targetMaximum = await token.balanceOf(owner);

    tokenPreSale = await TokenPreSale.deploy(
      token.target,
      tokenPrice,
      targetMaximum,
      targetMinimum,
      cooldownPeriod,
      deadline
    );
  });

  describe("initiatePresale", function() {
    const duration = 1000;

    it("Should initiate the presale correctly", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);

      const tx = await tokenPreSale.initiatePresale(duration);

      expect(await tokenPreSale.started()).to.equal(true);
      expect(await tokenPreSale.startBlock()).to.equal(tx.blockNumber + 1);
      expect(await tokenPreSale.endBlock()).to.equal(tx.blockNumber + 1 + duration);
      expect(await tokenPreSale.deadlineBlock()).to.equal(tx.blockNumber + 1 + duration + deadline);

      await expect(tx)
        .to.emit(tokenPreSale, "SaleInitiated")
        .withArgs(
          tx.blockNumber + 1,
          tx.blockNumber + 1 + duration
        );
    });

    it("Should fail if presale is already started", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      await expect(tokenPreSale.initiatePresale(duration)).to.be.revertedWith(
        "Presale already started"
      );
    });

    it("Should fail if caller is not the owner", async function() {
      await expect(tokenPreSale.connect(addr1).initiatePresale(duration))
        .to.be.revertedWithCustomError(tokenPreSale, 'OwnableUnauthorizedAccount')
        .withArgs(addr1);
    });
  });

  describe("finishSale", function() {
    const duration = 100;

    it("Should finish the sale successfully", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      const contribution = ethers.parseEther("5");
      await tokenPreSale.connect(addr1).contribute({ value: contribution });

      await mine(duration);
      const tx = await tokenPreSale.finishSale();

      expect(await tokenPreSale.finished()).to.equal(true);
      expect(await tokenPreSale.cooldownBlock()).to.equal(tx.blockNumber + cooldownPeriod);

      await expect(tx).to.emit(tokenPreSale, "Finished");
    });

    it("Should fail if presale is not started", async function() {
      await expect(tokenPreSale.finishSale()).to.be.revertedWith("Sale not started");
    });

    it("Should fail if presale is not ended", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      await expect(tokenPreSale.finishSale()).to.be.revertedWith("Invalid finish time");
    });

    it("Should fail if presale is already finished", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      await mine(await tokenPreSale.endBlock());
      await tokenPreSale.finishSale();
      await expect(tokenPreSale.finishSale()).to.be.revertedWith("Sale already finished");
    });

    it("Should fail if deadline is passed", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      await mine(await tokenPreSale.deadlineBlock());
      await expect(tokenPreSale.finishSale()).to.be.revertedWith("Invalid finish time");
    });
  });

  describe("contribute", function() {
    const duration = 1000;

    it("Should allow multiple accounts to contribute", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      const contribution1 = tokenPrice * 2n;
      const contribution2 = tokenPrice * 3n;
      const contribution3 = tokenPrice * 4n;

      await tokenPreSale.connect(addr1).contribute({ value: contribution1 });
      await tokenPreSale.connect(addr2).contribute({ value: contribution2 });
      await tokenPreSale.connect(owner).contribute({ value: contribution3 });

      expect(await tokenPreSale.contribution(addr1.address)).to.equal(contribution1);
      expect(await tokenPreSale.contribution(addr2.address)).to.equal(contribution2);
      expect(await tokenPreSale.contribution(owner.address)).to.equal(contribution3);
      expect(await tokenPreSale.totalContribution()).to.equal(
        contribution1 + contribution2 + contribution3
      );
    });

    it("should refund excess contribution", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      const contribution = ethers.parseEther("1");

      // calc refund
      const tokenPrice = await tokenPreSale.tokenPrice();
      const tokenAmount = contribution / tokenPrice;
      const contributionAmount = tokenAmount * tokenPrice;
      const refundAmount = contribution - contributionAmount;

      await expect(tokenPreSale.connect(addr1).contribute({ value: contribution }))
        .to.emit(tokenPreSale, "RefundContribution")
        .withArgs(refundAmount);
    });

    it("Should fail if presale is not active", async function() {
      await expect(tokenPreSale.contribute({ value: ethers.parseEther("1") })).to.be.revertedWith(
        "Presale is not active"
      );
    });

    it("Should fail if contribution amount is invalid", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      await expect(tokenPreSale.contribute({ value: 0 })).to.be.revertedWith(
        "Invalid contribution amount"
      );
    });
  });

  describe("claim", function() {
    const duration = 1000;

    // it("should allow multiple contributors to claim tokens", async function() {
    //   await token.approve(tokenPreSale.target, targetMaximum);
    //   await tokenPreSale.initiatePresale(duration);
    //
    //   const contribution1 = ethers.parseEther("0.5");
    //   await tokenPreSale.connect(addr1).contribute({ value: contribution1 });
    //
    //   const contribution2 = ethers.parseEther("0.3");
    //   await tokenPreSale.connect(addr2).contribute({ value: contribution2 });
    //
    //   expect(await tokenPreSale.contribution(addr1.address)).to.equal(contribution1);
    //   expect(await tokenPreSale.contribution(addr2.address)).to.equal(contribution2);
    //
    //   expect(await tokenPreSale.claimState(addr1.address)).to.equal(false);
    //   expect(await tokenPreSale.claimState(addr2.address)).to.equal(false);
    //
    //   await mine(duration);
    //   await tokenPreSale.finishSale();
    //   await mine(cooldownPeriod);
    //
    //   console.log('totalContribution', await tokenPreSale.totalContribution());
    //   console.log('minContribution', await tokenPreSale.minContribution());
    //
    //   await expect(tokenPreSale.connect(addr1).claim())
    //     .to.emit(tokenPreSale, "Claimed")
    //     .to.emit(tokenPreSale, "TokenClaimed");
    //
    //   await expect(tokenPreSale.connect(addr2).claim())
    //     .to.emit(tokenPreSale, "Claimed")
    //     .to.emit(tokenPreSale, "TokenClaimed");
    //
    //   expect(await tokenPreSale.claimState(addr1.address)).to.equal(true);
    //   expect(await tokenPreSale.claimState(addr2.address)).to.equal(true);
    //
    //   const addr1Balance = await token.balanceOf(addr1.address);
    //   const addr2Balance = await token.balanceOf(addr2.address);
    //
    //   console.log(addr1Balance, addr2Balance);
    //
    //   // expect(addr2Balance).to.equal(ethers.parseEther("30"));
    //   // expect(addr1Balance).to.equal(ethers.parseEther("50"));
    // });
  });
});
