// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Char.sol";
import "./VerifySignature.sol";

contract CrowdSale {
    using SafeCast for uint256;

    VerifySignature public immutable ec = new VerifySignature();
    HeroesGPT public char_contract;

    // TODO: add owner methods
    // TODO: add price for buy token!
    // TODO: add possible to buy via DEX.

    address public server_address;

    modifier onlyNotContract() {
        uint32 size;
        address _addr = msg.sender;
        require(_addr != address(0), "sender is zero");
        assembly {
            size := extcodesize(_addr)
        }
        require(size == 0, "sender is contract");
        _;
    }

    constructor(address _server, address _char) {
        server_address = _server;
        char_contract = HeroesGPT(_char);
    }

    function buy(string memory _uri, bytes memory _signature) external onlyNotContract {
        bool verify = ec.verify(server_address, msg.sender, _uri, _signature);
        require(verify, "invalid signautre");

        uint256 newTokenId = char_contract.totalSupply() + 1;

        char_contract.safeMint(msg.sender, newTokenId, _uri);
    }
}
