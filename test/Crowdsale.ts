import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CrowdSale contract", function () {
    let Crowdsale: any;
    let crowdsale: any;
    let HeroesGPT: any;
    let heroesGPT: any;
    let serverSign: HardhatEthersSigner;
    let accounts: HardhatEthersSigner[];

    beforeEach(async function () {
        [serverSign, ...accounts] = await ethers.getSigners();

        HeroesGPT = await ethers.getContractFactory("HeroesGPT");
        Crowdsale = await ethers.getContractFactory("CrowdSale");

        heroesGPT = await HeroesGPT.deploy();

        accounts = await ethers.getSigners();
        crowdsale = await Crowdsale.deploy(serverSign.address, heroesGPT.target);

        const role = await heroesGPT.MINTER_ROLE();
        await heroesGPT.grantRole(role, crowdsale.target);
    });

    describe("try buy token", async function() {
        it("sign sig and try buy", async function () {
            const newURL = "test_url";
            const to = accounts[2];
            const hash = ethers.keccak256(ethers.solidityPacked(['address', 'string'], [to.address, newURL]));
            const sig = await serverSign.signMessage(ethers.toBeArray(hash));

            await crowdsale.connect(to).buy(newURL, sig);

            expect(await heroesGPT.ownerOf(1)).to.equal(to.address);
            expect(await heroesGPT.tokenURI(1)).to.equal(newURL);
        });
    });
});