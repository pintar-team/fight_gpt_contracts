import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VerifySignature contract", () => {
    let VerifySignature: any;
    let verifySignature: any;
    let accounts: HardhatEthersSigner[];

    beforeEach(async function () {
        VerifySignature = await ethers.getContractFactory("VerifySignature");
        accounts = await ethers.getSigners();

        verifySignature = await VerifySignature.deploy();
    });

    describe("Check signature", async () => {
        const signer = accounts[0];
        const to = accounts[1].address;
        const amount = 0;
        const message = "Hello gpt";
        const nonce = 1;

        const hash = await verifySignature.getMessageHash(to, amount, message, nonce);
        const sig = await signer.signMessage(Buffer.from(hash, 'hex'));
        const ethHash = await verifySignature.getEthSignedMessageHash(hash);

        console.log("signer          ", signer.address);
        console.log("recovered signer", await verifySignature.recoverSigner(ethHash, sig));

        expect(
            await verifySignature.verify(signer.address, to, amount, message, nonce, sig)
        ).to.equal(true);

        expect(
            await verifySignature.verify(signer.address, to, amount + 1, message, nonce, sig)
        ).to.equal(false);
    });
});