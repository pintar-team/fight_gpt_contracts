import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VerifySignature contract", function() {
    let VerifySignature: any;
    let verifySignature: any;
    let accounts: HardhatEthersSigner[];

    beforeEach(async function() {
        VerifySignature = await ethers.getContractFactory("VerifySignature");
        accounts = await ethers.getSigners();

        verifySignature = await VerifySignature.deploy();
    });

    describe("Check signature", async function() {
        it("sign message and check sig", async function() {
            const signer = accounts[0];
            const to = accounts[1].address;
            const message = "Hello gpt";

            const hash = await verifySignature.getMessageHash(to, message);
            const sig = await signer.signMessage(ethers.toBeArray(hash));
            const ethHash = await verifySignature.getEthSignedMessageHash(hash);

            // console.log("signer          ", signer.address);
            // console.log("recovered signer", await verifySignature.recoverSigner(ethHash, sig));

            expect(
                await verifySignature.recoverSigner(ethHash, sig)
            ).to.equal(signer.address);

            expect(
                await verifySignature.verify(signer.address, to, message, sig)
            ).to.equal(true);

            expect(
                await verifySignature.verify(signer.address, to, message + 'wrong', sig)
            ).to.equal(false);
        });
    });
});
