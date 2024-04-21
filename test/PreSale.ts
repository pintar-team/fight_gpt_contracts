import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenPreSale", function() {
  let tokenPreSale: any;
  let token: any;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();

    const TokenPreSale = await ethers.getContractFactory("TokenPreSale");

    tokenPreSale = await TokenPreSale.deploy(
      ethers.parseEther("0.01"), // token_price
      1000, // target_maximum
      100,  // target_minimum
      100,  // cooldown
      1000  // deadline
    );

    const tokenAddress = await tokenPreSale.token();

    token = await ethers.getContractAt("IERC20", tokenAddress);
    console.log('init', await ethers.provider.getBlockNumber());
  });

  it("Should initiate the sale correctly", async function() {
    const currentBlockNumber = await ethers.provider.getBlockNumber();
    await expect(tokenPreSale.initiateSale(1000))
      .to.emit(tokenPreSale, "SaleInitiated")
      .withArgs(
        BigInt((currentBlockNumber) + 2), // 2 because the tx in current block + 1
        BigInt((currentBlockNumber) + 1002), // 1002 because (current_block + 1) - duration
        ethers.parseEther("1"), // min_contribution
        ethers.parseEther("10")  // max_contribution
      );
  });

  // it("Should contribute and claim tokens", async function() {
  //   await tokenPreSale.initiateSale(1000);
  //
  //   const contribution = ethers.parseEther("5");
  //   await tokenPreSale.connect(addr1).contribute({ value: contribution });
  //
  //   expect(await tokenPreSale.contribution(addr1.getAddress())).to.equal(contribution);
  //
  //   await ethers.provider.send("evm_increaseTime", [1500]);
  //   await ethers.provider.send("evm_mine", []);
  //
  //   await expect(tokenPreSale.connect(addr1).claim())
  //     .to.emit(token, "Transfer")
  //     .withArgs(tokenPreSale.address, addr1.getAddress(), 500);
  //
  //   expect(await token.balanceOf(addr1.getAddress())).to.equal(500);
  // });
  //
  // it("Should finish the sale and distribute tokens", async function() {
  //   await tokenPreSale.initiateSale(1000);
  //
  //   await tokenPreSale.connect(addr1).contribute({ value: ethers.parseEther("5") });
  //   await tokenPreSale.connect(addr2).contribute({ value: ethers.parseEther("10") });
  //
  //   await ethers.provider.send("evm_increaseTime", [1001]);
  //   await ethers.provider.send("evm_mine", []);
  //
  //   await expect(tokenPreSale.finishSale())
  //     .to.emit(tokenPreSale, "Finished");
  //
  //   expect(await token.balanceOf(owner.getAddress())).to.equal(500);
  //   expect(await ethers.provider.getBalance(tokenPreSale.address)).to.equal(0);
  // });
});
