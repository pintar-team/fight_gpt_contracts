import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WaitList contract", function () {
    let WaitList: any;
    let waitList: any;
    let accounts: HardhatEthersSigner[];

    beforeEach(async function () {
        WaitList = await ethers.getContractFactory("WaitList");
        accounts = await ethers.getSigners();
        waitList = await WaitList.deploy();
    });

    describe("Check add and remove elements", async function() {
        it("add and pop", async function () {

          expect(await waitList.hasSpace()).to.equal(true);
          await waitList.add(1);
          expect(await waitList.hasSpace()).to.equal(true);
          await waitList.add(2);
          await expect(waitList.add(2)).to.be.reverted;
          await waitList.add(3);
          expect(await waitList.hasSpace()).to.equal(true);
          await waitList.add(4);
          expect(await waitList.hasSpace()).to.equal(true);
          await waitList.add(5);

          await expect(waitList.add(6)).to.be.reverted;
          expect(await waitList.count()).to.equal(5n);
          expect(await waitList.waiting(0)).to.equal(1n);
          expect(await waitList.waiting(1)).to.equal(2n);
          expect(await waitList.waiting(2)).to.equal(3n);
          expect(await waitList.waiting(3)).to.equal(4n);
          expect(await waitList.waiting(4)).to.equal(5n);

          expect(await waitList.hasSpace()).to.equal(false);
          await waitList.pop();
          expect(await waitList.hasSpace()).to.equal(true);

          expect(await waitList.waiting(4)).to.equal(0n);
          expect(await waitList.waiting(0)).to.equal(2n);

          await waitList.pop();

          expect(await waitList.waiting(4)).to.equal(0n);
          expect(await waitList.waiting(3)).to.equal(0n);
          expect(await waitList.waiting(0)).to.equal(3n);

          await waitList.add(1);

          expect(await waitList.waiting(3)).to.equal(1n);
          expect(await waitList.waiting(4)).to.equal(0n);

          await waitList.add(2);

          expect(await waitList.waiting(3)).to.equal(1n);
          expect(await waitList.waiting(4)).to.equal(2n);
        });
    });
});