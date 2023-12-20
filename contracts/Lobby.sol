// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Effect.sol";
import "./Char.sol";
import "./ERC20.sol";

contract Lobby {
    using SafeCast for uint256;

    bool public pause = false;
    uint256 public min_stake = 100;

    Effect public contract_effects;
    HeroesGPT public contract_char_token;
    ERC20Token public contract_token;

    // queue for char, wait for fight
    uint256[20] public queue;
    // owner >> char_id
    mapping(address => uint256) public char_owners;
    // owner >> stake_amount
    mapping(address => uint256) public stake_amount;

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

    function stake(uint256 _amount) external {
        contract_token.transferFrom(msg.sender, address(this), _amount);
        
        stake_amount[msg.sender] += _amount;
        // TODO: emit event.
    }

    function unstake(uint256 _amount) external {
        require(stake_amount[msg.sender] <= _amount, "invalid amount");

        contract_token.transferFrom(address(this), msg.sender, _amount);
        stake_amount[msg.sender] -= _amount;
        // TODO: emit event.
    }

    function add(uint256 _charID, uint256 _stake_amount) external {
        require(!pause, "contract on pause");
        require(_stake_amount >= min_stake, "invalid stake amount");

        contract_char_token.transferFrom(msg.sender, address(this), _charID);
    }
}
