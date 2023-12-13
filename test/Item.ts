
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
            // console.log(item.interface);
            const role = await item.MINTER_ROLE();
            expect(await item.hasRole(role, owner.address)).to.equal(true);
            expect(await item.hasRole(role, addr1.address)).to.equal(false);
        });

    //     it("Should assign the total supply of tokens to the owner", async function () {
    //         const ownerBalance = await item.balanceOf(owner.address);
    //         expect(await item.totalSupply()).to.equal(ownerBalance);
    //     });
    // });

    // describe("Transactions", function () {
    //     it("Should transfer tokens between accounts", async function () {
    //         await item.safeMint(addr1.address, 1);
    //         const addr1Balance = await item.balanceOf(addr1.address);
    //         expect(addr1Balance).to.equal(1);

    //         await item.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
    //         const addr2Balance = await item.balanceOf(addr2.address);
    //         expect(addr2Balance).to.equal(1);
    //     });

    //     it("Should fail if sender doesn’t have enough tokens", async function () {
    //         const initialOwnerBalance = await item.balanceOf(owner.address);

    //         await expect(
    //             item.connect(addr1).transferFrom(addr1.address, owner.address, 1)
    //         ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

    //         expect(await item.balanceOf(owner.address)).to.equal(
    //             initialOwnerBalance
    //         );
    //     });
    });
});
