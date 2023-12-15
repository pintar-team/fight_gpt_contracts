
import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Item contract", function () {
    let Item: any;
    let item: any;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];

    beforeEach(async function () {
        Item = await ethers.getContractFactory("Item");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        item = await Item.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right admin", async function () {
            const role = await item.DEFAULT_ADMIN_ROLE();
            expect(await item.hasRole(role, owner.address)).to.equal(true);
            expect(await item.hasRole(role, addr1.address)).to.equal(false);
        });

        it("Should set the right minter", async function () {
            const role = await item.MINTER_ROLE();
            expect(await item.hasRole(role, owner.address)).to.equal(true);
            expect(await item.hasRole(role, addr1.address)).to.equal(false);
        });

        it("Should zero totalSupply", async function () {
            const totalSupply = await item.totalSupply();
            expect(totalSupply).to.equal(0n);
        });

        it("ERC721 interface supports", async function () {
            expect(await item.supportsInterface("0x80ac58cd")).to.equal(true);
        });

        it("ERC721Enumerable interface supports", async function () {
            expect(await item.supportsInterface("0x780e9d63")).to.equal(true);
        });

        it("ERC2981 interface supports", async function () {
            expect(await item.supportsInterface("0x2a55205a")).to.equal(true);
        });

        it("interface not supports", async function () {
            expect(await item.supportsInterface("0x12345678")).to.equal(false);
        });

        it("try mint a token", async function () {
            const tokenId = 1;
            const tokenURI = "http://example.com/token1";
            const effectID = 333;
            const effects = 254;

            await item.safeMint(addr1.address, tokenId, tokenURI, effectID, effects);
            expect(await item.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await item.tokenURI(tokenId)).to.equal(tokenURI);
            expect(await item.getEffectsID(tokenId)).to.equal(effectID);
            expect(await item.getNumbersOfEffects(tokenId)).to.equal(effects);
        });

        it("try Batch Minting tokens", async function () {
            const effects = [123, 456, 789];
            const number_effects = [10, 1, 2];
            const numberOfTokens = effects.length;

            await item.batchMint(addr2.address, effects, number_effects);

            const totalSupply = await item.totalSupply();

            expect(numberOfTokens).to.equal(totalSupply);
            expect(await item.getEffectsID(1)).to.equal(123);
            expect(await item.getEffectsID(2)).to.equal(456);
            expect(await item.getEffectsID(3)).to.equal(789);

            expect(await item.getNumbersOfEffects(1)).to.equal(10);
            expect(await item.getNumbersOfEffects(2)).to.equal(1);
            expect(await item.getNumbersOfEffects(3)).to.equal(2);
        });

        it("try mint a token and check royaltyInfo", async function () {
            const tokenId = 1;
            const tokenURI = "1";
            const effectID = 333;
            const effects_number = 1;
            const to = addrs[0];

            await item.safeMint(to, tokenId, tokenURI, effectID, effects_number);

            const [owner, rewards] = await item.royaltyInfo(1, 5000);

            expect(owner).to.equal(to.address);
            expect(rewards).to.equal(250n);
        });

        it("try mint a token and burn it", async function () {
            const tokenId = 1;
            const tokenURI = "1";
            const effectID = 333;
            const effects_number = 22;

            await item.safeMint(owner, tokenId, tokenURI, effectID, effects_number);
            const totalSupply = await item.totalSupply();

            expect(totalSupply).to.equal(tokenId);
            expect(await item.getEffectsID(tokenId)).to.equal(effectID);
            expect(await item.getNumbersOfEffects(1)).to.equal(effects_number);

            await item.burn(tokenId);

            const new_totalSupply = await item.totalSupply();

            expect(new_totalSupply).to.equal(0n);
            expect(await item.getEffectsID(tokenId)).to.equal(0n);
            expect(await item.getNumbersOfEffects(tokenId)).to.equal(0n);
        });

        it("test approve for burn", async function () {
            const tokenId = 1;
            const tokenURI = "1";
            const effectID = 333;
            const effects_number = 22;
            const to = addrs[0];

            await item.safeMint(to, tokenId, tokenURI, effectID, effects_number);
            await item.connect(to).approve(addr2, tokenId);
            await item.connect(addr2).burn(tokenId);
        });
    });
});
