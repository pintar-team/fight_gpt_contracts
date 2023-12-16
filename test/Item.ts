
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

            await item.grantRole(role, addr2.address);

            expect(await item.hasRole(role, addr2.address)).to.equal(true);
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
            const role = await item.MINTER_ROLE();

            await item.grantRole(role, owner);
            await item.safeMint(addr1.address, tokenId, tokenURI);
            expect(await item.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await item.tokenURI(tokenId)).to.equal(tokenURI);
        });

        it("try mint a token and check royaltyInfo", async function () {
            const tokenId = 1;
            const tokenURI = "1";
            const to = addrs[0];
            const role = await item.MINTER_ROLE();

            await item.grantRole(role, owner);
            await item.safeMint(to, tokenId, tokenURI);

            const [tokenOwner, rewards] = await item.royaltyInfo(tokenId, 5000);

            expect(tokenOwner).to.equal(to.address);
            expect(rewards).to.equal(250n);
        });

        it("try mint a token and burn it", async function () {
            const tokenId = 1;
            const tokenURI = "1";
            const role = await item.MINTER_ROLE();

            await item.grantRole(role, owner);
            await item.safeMint(owner, tokenId, tokenURI);
            const totalSupply = await item.totalSupply();

            expect(totalSupply).to.equal(tokenId);

            await item.burn(tokenId);

            const new_totalSupply = await item.totalSupply();

            expect(new_totalSupply).to.equal(0n);
        });

        it("test approve for burn", async function () {
            const tokenId = 1;
            const tokenURI = "1";
            const to = addrs[0];
            const role = await item.MINTER_ROLE();

            await item.grantRole(role, owner);
            await item.safeMint(to, tokenId, tokenURI);
            await item.connect(to).approve(addr2, tokenId);
            await item.connect(addr2).burn(tokenId);
        });
    });
});
