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

  const tokenPrice = ethers.parseEther("0.0000001");
  const targetMaximum = ethers.parseEther("1");
  const targetMinimum = ethers.parseEther("0.01");
  const cooldownPeriod = 3600;
  const deadline = 7200;

  beforeEach(async function() {
    [owner, addr1, addr2, ...addresses] = await ethers.getSigners();

    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    const TokenPreSale = await ethers.getContractFactory("TokenPreSale");

    token = await ERC20Token.deploy();

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
      await expect(tokenPreSale.connect(addr1).initiatePresale(duration)).to.be.revertedWith(
        "Not the owner"
      );
    });
  });

  describe("contribute", function() {
    const duration = 1000;

    it("Should allow multiple accounts to contribute", async function() {
      await token.approve(tokenPreSale.target, targetMaximum);
      await tokenPreSale.initiatePresale(duration);

      const contribution1 = ethers.parseEther("1");
      const contribution2 = ethers.parseEther("2");
      const contribution3 = ethers.parseEther("1.5");

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
});
