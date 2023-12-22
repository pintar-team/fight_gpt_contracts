// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Char.sol";
import "./VerifySignature.sol";

contract CrowdSale {
    using SafeCast for uint256;

    VerifySignature public immutable ec = new VerifySignature();

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

    constructor(address _server) {
        server_address = _server;
    }

    function buy() external onlyNotContract {
        
    }
}
