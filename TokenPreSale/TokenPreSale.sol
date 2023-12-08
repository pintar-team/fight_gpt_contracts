// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "../Token/ERC20.sol";

contract TokenPreSale {
    ERC20Token public immutable token;
    address public immutable owner;
    uint256 public immutable token_price;
    uint256 public immutable target_maximum;
    uint256 public immutable target_minimum;
    uint256 public immutable cooldown;
    uint256 public immutable deadline;

    // token_price * target_minimum
    uint256 public min_contribution;
    // token_price * target_maximum
    uint256 public max_contribution;

    bool public isPaused = false;
    bool public finished = false;
    bool public finished_fallback = false;

    uint256 public total_contribution = 0;
    uint256 public start_block = block.number;
    uint256 public end_block = block.number;
    uint256 public cooldown_block = block.number;
    uint256 public deadline_block = block.number;

    // address > BNB amount
    mapping(address => uint256) public contribution;
    // TODO: maybe bool!
    mapping(address => uint8) public claim_state;

    event TokensBought(
        address indexed user,
        uint256 tokensBought,
        uint256 amountPaid,
        uint256 timestamp
    );

    event TokensClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event PresalePaused(uint256 timestamp);
    event PresaleUnpaused(uint256 timestamp);

    modifier onlyNotPaused() {
        require(!isPaused, "Presale is paused");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier throwIfDeadline() {
        bool isActive = (!finished && block.number < deadline_block);

        require(isActive, "Presale is deadlines");
        _;
    }

    modifier throwNotDeadline() {
        require(block.number < deadline_block, "Presale is not deadline");
        _;
    }

    modifier throwNotEnded() {
        require(block.number < end_block, "Presale is not ended");
        _;
    }

    modifier throwIfCooldown() {
        require(block.number < cooldown_block, "Presale is cooldown");
        _;
    }

    modifier throwNotFinished() {
        require(finished, "Presale is not finished");
        _;
    }

    modifier throwIfFinished() {
        require(!finished, "Presale is finished");
        _;
    }

    modifier throwIfFinishedFallback() {
        require(!finished_fallback, "Presale is finished fallback");
        _;
    }

    constructor(
        uint256 _token_price,
        uint256 _target_maximum, 
        uint256 _target_minimum, 
        uint256 _cooldown,
        uint256 _deadline
    ) {
        token = new ERC20Token();
        owner = msg.sender;
        min_contribution = _token_price * _target_minimum;
        max_contribution = _token_price * _target_maximum;
    }
}
