// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Effect.sol";
import "./Char.sol";

contract Lobby {
    using SafeCast for uint256;

    bool public pause = false;

    Effect public contract_effects;
    HeroesGPT public contract_char_token;

    // queue for char, wait for fight
    uint256[20] public queue;
    // owner >> char_id
    mapping(address => uint256) public char_owners;
    // char >> stake_amount
    mapping(uint256 => uint256) public char_stake_amount;

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

    function addChat(uint256 _charID) external {
        contract_char_token.transferFrom(address(this), msg.sender, _charID);
    }
}
