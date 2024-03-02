import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CrowdSale contract", function() {
    let Crowdsale: any;
    let crowdsale: any;
    let HeroesGPT: any;
    let heroesGPT: any;
    let serverSign: HardhatEthersSigner;
    let accounts: HardhatEthersSigner[];

    beforeEach(async function() {
        [serverSign, ...accounts] = await ethers.getSigners();

        HeroesGPT = await ethers.getContractFactory("HeroesGPT");
        Crowdsale = await ethers.getContractFactory("CrowdSale");

        heroesGPT = await HeroesGPT.deploy();

        accounts = await ethers.getSigners();
        crowdsale = await Crowdsale.deploy(serverSign.address, heroesGPT.target, accounts[5]);

        const role = await heroesGPT.MINTER_ROLE();
        await heroesGPT.grantRole(role, crowdsale.target);
    });

    describe("try buy native token", async function() {
        it("sign sig and try buy", async function() {
            const newURL = "test_url";
            const to = accounts[2];
            const tokenId = 42n;
            const hash = ethers.keccak256(ethers.solidityPacked(['address', 'string', 'uint256'], [to.address, newURL, tokenId]));
            let sig = await serverSign.signMessage(ethers.toBeArray(hash));

            await crowdsale.connect(to).buyNative(newURL, tokenId, sig, {
                value: ethers.parseEther('1.0')
            });

            expect(await heroesGPT.ownerOf(tokenId)).to.equal(to.address);
            expect(await heroesGPT.tokenURI(tokenId)).to.equal(newURL);

            expect(await accounts[5].provider.getBalance(accounts[5])).to.equal(10000000000000000010000n);

            // invalid sig
            sig = await accounts[8].signMessage(ethers.toBeArray(hash));
            await expect(crowdsale.connect(to).buyNative(newURL, tokenId, sig, {
                value: ethers.parseEther('0.1')
            })).to.be.reverted;
            await expect(crowdsale.connect(to).buyNative(newURL, tokenId, sig, {
                value: ethers.parseEther('1.0')
            })).to.be.reverted;
        });
    });
});
