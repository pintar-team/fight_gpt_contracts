
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

    describe("test mint", function () {
        it("Should set the right admin", async function () {
            const itemMintRole = await item.MINTER_ROLE();

            await item.grantRole(itemMintRole, effect.target);

            const to = addr2;
            const effects = [44, 66, 77];
            const numberEffects = [20, 10, 8];

            await effect.batchMint(to, effects, numberEffects);

            const [token1NumberOfEffects, token1EffectID] = await effect.getEffect(1);
            const [token2NumberOfEffects, token2EffectID] = await effect.getEffect(2);
            const [token3NumberOfEffects, token3EffectID] = await effect.getEffect(3);

            expect(token1NumberOfEffects).to.equal(numberEffects[0]);
            expect(token1EffectID).to.equal(effects[0]);

            expect(token2NumberOfEffects).to.equal(numberEffects[1]);
            expect(token2EffectID).to.equal(effects[1]);

            expect(token3NumberOfEffects).to.equal(numberEffects[2]);
            expect(token3EffectID).to.equal(effects[2]);


            // console.log(effect.interface);
        });
    });
});
