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
  const tokenPrice = ethers.parseEther("0.01");
  const targetMinimum = ethers.parseEther("0.01");
  const cooldownPeriod = 3600;
  const deadline = 7200;

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

      await mine(await tokenPreSale.endBlock());
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

      await expect(tokenPreSale.finishSale()).to.be.revertedWith("Sale not ended");
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
      await expect(tokenPreSale.finishSale()).to.be.revertedWith("Finish deadline passed");
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

  // describe("claim", function() {
  //   const duration = 1000;
  //
  //   it("Should allow multiple contributors to claim tokens", async function() {
  //     await token.approve(tokenPreSale.target, targetMaximum);
  //     await tokenPreSale.initiatePresale(duration);
  //
  //     console.log(await token.balanceOf(owner.address));
  //
  //     const contribution1 = ethers.parseEther("1");
  //     const contribution2 = ethers.parseEther("2");
  //     const contribution3 = ethers.parseEther("1.5");
  //     const endBlock = await tokenPreSale.endBlock();
  //     const cooldownBlock = await tokenPreSale.cooldownBlock();
  //
  //     await tokenPreSale.connect(addresses[0]).contribute({ value: contribution1 });
  //     await tokenPreSale.connect(addresses[1]).contribute({ value: contribution2 });
  //     await tokenPreSale.connect(addresses[2]).contribute({ value: contribution3 });
  //
  //     await mine(endBlock);
  //     await tokenPreSale.finishSale();
  //
  //     const initialBalance1 = await token.balanceOf(addr1.address);
  //     const initialBalance2 = await token.balanceOf(addr2.address);
  //     const finalBalance3 = await token.balanceOf(owner.address);
  //
  //     console.log(finalBalance3);
  //     expect(initialBalance1).to.equal(0n);
  //     expect(initialBalance2).to.equal(0n);
  //
  //     await mine(cooldownBlock + 1n);
  //     await tokenPreSale.connect(addr1).claim();
  //     await tokenPreSale.connect(addr2).claim();
  //     await tokenPreSale.connect(owner).claim();
  //
  //     const finalBalance1 = await token.balanceOf(addr1.address);
  //     const finalBalance2 = await token.balanceOf(addr2.address);
  //     // const finalBalance3 = await token.balanceOf(owner.address);
  //
  //     expect(finalBalance1).to.equal(initialBalance1 + contribution1 / ethers.parseEther("0.1"));
  //     expect(finalBalance2).to.equal(initialBalance2 + contribution2 / ethers.parseEther("0.1"));
  //     // expect(finalBalance3).to.equal(initialBalance3 + contribution3 / ethers.parseEther("0.1"));
  //   });
  //
  //   // it("Should fail if presale is not finished", async function() {
  //   //   // Одобрение для контракта ZPresale на перевод токенов от владельца
  //   //   await token.approve(presale.address, ethers.utils.parseEther("1000"));
  //   //
  //   //   const duration = 100;
  //   //   await presale.initiatePresale(duration);
  //   //
  //   //   // Попытка клейма до завершения пресейла
  //   //   await expect(presale.claim()).to.be.revertedWith("Presale is not finished");
  //   // });
  //
  //   // it("Should fail if claim deadline passed", async function() {
  //   //   await token.approve(presale.address, ethers.utils.parseEther("1000"));
  //   //
  //   //   const duration = 100;
  //   //   await presale.initiatePresale(duration);
  //   //
  //   //   await ethers.provider.send("evm_mine", [await presale.endBlock()]);
  //   //   await presale.finishSale();
  //   //
  //   //   await ethers.provider.send("evm_mine", [await presale.deadlineBlock()]);
  //   //
  //   //   await expect(presale.claim()).to.be.revertedWith("Claim deadline passed");
  //   // });
  //
  //   // it("Should fail if already claimed", async function() {
  //   //   await token.approve(presale.address, ethers.utils.parseEther("1000"));
  //   //
  //   //   const duration = 100;
  //   //   await presale.initiatePresale(duration);
  //   //
  //   //   const contribution = ethers.utils.parseEther("10");
  //   //   await presale.connect(addr1).contribute({ value: contribution });
  //   //
  //   //   await ethers.provider.send("evm_mine", [await presale.endBlock()]);
  //   //   await presale.finishSale();
  //   //
  //   //   await ethers.provider.send("evm_mine", [await presale.cooldownBlock()]);
  //   //   await presale.connect(addr1).claim();
  //   //
  //   //   await expect(presale.connect(addr1).claim()).to.be.revertedWith("Already claimed");
  //   // });
  // });
});
