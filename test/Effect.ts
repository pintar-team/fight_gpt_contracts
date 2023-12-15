
import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Item contract", function () {
    let Effect: any;
    let effect: any;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];

    beforeEach(async function () {
        Effect = await ethers.getContractFactory("Effect");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        effect = await Effect.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right admin", async function () {
        });
    });
});
