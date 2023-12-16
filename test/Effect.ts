
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

    describe("Effect: test batchMint", function () {
        it("test batchMint", async function () {
            const itemMintRole = await item.MINTER_ROLE();

            await item.grantRole(itemMintRole, effect.target);

            const to = addr2;
            const effects = [44, 66, 77];
            const numberEffects = [20, 10, 8];

            await effect.batchMint(to, effects, numberEffects);

            const [token1EffectID, token1NumberOfEffects] = await effect.getEffect(1);
            const [token2EffectID, token2NumberOfEffects] = await effect.getEffect(2);
            const [token3EffectID, token3NumberOfEffects] = await effect.getEffect(3);

            expect(token1NumberOfEffects).to.equal(numberEffects[0]);
            expect(token1EffectID).to.equal(effects[0]);

            expect(token2NumberOfEffects).to.equal(numberEffects[1]);
            expect(token2EffectID).to.equal(effects[1]);

            expect(token3NumberOfEffects).to.equal(numberEffects[2]);
            expect(token3EffectID).to.equal(effects[2]);
        });
        it("test take and claim token", async function () {
            const itemMintRole = await item.MINTER_ROLE();
            const charMintRole = await heroesGPT.MINTER_ROLE();

            await item.grantRole(itemMintRole, effect.target);
            await heroesGPT.grantRole(charMintRole, owner);

            const player1 = addrs[0];
            const player2 = addrs[1];
            const player3 = addrs[2];

            await effect.batchMint(player1, [10], [30]);
            await effect.batchMint(player2, [11], [40]);
            await effect.batchMint(player3, [2], [33]);

            await heroesGPT.safeMint(player1, 1, "uri1");
            await heroesGPT.safeMint(player2, 2, "uri2");
            await heroesGPT.safeMint(player3, 3, "uri3");

            await expect(effect.connect(player1).takeThePill(1, 1)).to.be.reverted;
            await expect(effect.connect(player2).takeThePill(2, 2)).to.be.reverted;
            await expect(effect.connect(player3).takeThePill(3, 3)).to.be.reverted;

            await item.connect(player1).approve(effect.target, 1);
            await item.connect(player2).approve(effect.target, 2);
            await item.connect(player3).approve(effect.target, 3);

            await effect.connect(player1).takeThePill(1, 1);
            await effect.connect(player2).takeThePill(2, 2);
            await effect.connect(player3).takeThePill(3, 3);

            const [token1EffectID, token1NumberOfEffects] = await effect.getCharEffects(1);
            expect(token1EffectID[0]).to.equal(10n);
            expect(token1NumberOfEffects[0]).to.equal(30n);

            const [token2EffectID, token2NumberOfEffects] = await effect.getCharEffects(2);
            expect(token2EffectID[0]).to.equal(11n);
            expect(token2NumberOfEffects[0]).to.equal(40n);

            const [token3EffectID, token3NumberOfEffects] = await effect.getCharEffects(3);
            expect(token3EffectID[0]).to.equal(2n);
            expect(token3NumberOfEffects[0]).to.equal(33n);
        });
    });
});
