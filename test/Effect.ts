
import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Item contract", function () {
    let Item: any;
    let item: any;
    let Effect: any;
    let effect: any;
    let HeroesGPT: any;
    let heroesGPT: any;

    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        Item = await ethers.getContractFactory("Item");
        Effect = await ethers.getContractFactory("Effect");
        HeroesGPT = await ethers.getContractFactory("HeroesGPT");

        item = await Item.deploy();
        heroesGPT = await HeroesGPT.deploy();
        effect = await Effect.deploy(item.target, heroesGPT.target);
    });

    describe("Deployment", function () {
        it("Should set the right admin", async function () {
        });
    });
});
