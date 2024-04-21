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

  beforeEach(async function() {
    [owner, addr1, addr2, ...addresses] = await ethers.getSigners();

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
  });

  it("Should initiate the sale correctly", async function() {
    const duration = 1000;
    const currentBlockNumber = await ethers.provider.getBlockNumber();

    await expect(tokenPreSale.initiateSale(duration))
      .to.emit(tokenPreSale, "SaleInitiated")
      .withArgs(
        BigInt((currentBlockNumber) + 2), // 2 because the tx in current block + 1
        BigInt((currentBlockNumber) + 1002), // 1002 because (current_block + 1) - duration
        ethers.parseEther("1"), // min_contribution
        ethers.parseEther("10")  // max_contribution
      );
  });

  it("Should handle contributions from multiple addresses and distribute tokens correctly", async function() {
    const duration = 1000;
    await tokenPreSale.initiateSale(duration);

    const contributions = [
      ethers.parseEther("2"),
      ethers.parseEther("3"),
      ethers.parseEther("1.5"),
      ethers.parseEther("4"),
      ethers.parseEther("2.5"),
      ethers.parseEther("1"),
      ethers.parseEther("3.5"),
      ethers.parseEther("2"),
      ethers.parseEther("4.5"),
      ethers.parseEther("1.5")
    ];

    for (let i = 0; i < 10; i++) {
      await tokenPreSale.connect(addresses[i]).contribute({ value: contributions[i] });
      const contributionAmount = await tokenPreSale.contribution(await addresses[i].getAddress());
      expect(contributionAmount).to.equal(contributions[i]);
    }

    // await ethers.provider.send("evm_increaseTime", [1500]);
    // await ethers.provider.send("evm_mine", []);

    await mine(duration);

    await tokenPreSale.connect(owner).finishSale();

    for (let i = 0; i < 10; i++) {
      const contribution = BigInt(contributions[i]);
      const expectedTokens = contribution / ethers.parseEther("0.01");

      await tokenPreSale.connect(addresses[i]).claim();

      console.log(expectedTokens, await token.balanceOf(await addresses[i].getAddress()));

      // expect(await token.balanceOf(await addresses[i].getAddress())).to.equal(expectedTokens);
    }

    // const ownerTokens = (await token.balanceOf(await owner.getAddress())).toString();
    //
    // console.log(ownerTokens);

    // expect(ownerTokens).to.equal("2500");
  });

  // it("Should contribute and claim tokens", async function() {
  //   const duration = 1000;
  //   const currentBlockNumber = await ethers.provider.getBlockNumber();
  //
  //   await tokenPreSale.initiateSale(duration);
  //
  //   const contribution = ethers.parseEther("5");
  //   await tokenPreSale.connect(addr1).contribute({ value: contribution });
  //
  //   expect(await tokenPreSale.contribution(addr1.getAddress())).to.equal(contribution);
  //
  //   console.log(await ethers.provider.getBlockNumber());
  //
  //   await expect(tokenPreSale.connect(addr1).claim())
  //     .to.be.reverted;
  //
  //   // await ethers.provider.send("evm_increaseTime", [1500]);
  //   // await ethers.provider.send("evm_mine", [100]);
  //
  //   await mine(100);
  //
  //   console.log(await ethers.provider.getBlockNumber());
  //
  //   // .to.emit(token, "Transfer")
  //   // .withArgs(tokenPreSale.address, addr1.getAddress(), 500);
  //
  //   // expect(await token.balanceOf(addr1.getAddress())).to.equal(500);
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
