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

  const tokenPrice = ethers.parseEther("0.1");
  const targetMaximum = ethers.parseEther("1000");
  const targetMinimum = ethers.parseEther("100");
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

});
