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
    bool public started  = false;
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

    event RefundContribution(
        uint256 amount,
        uint256 current_contribution
    );
    event ContrubutionAdded(
        uint256 amount,
        uint256 new_contribution
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


    modifier throwNotActive() {
        require(block.number >= start_block && block.number < end_block, "Presale is not active");
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

    modifier throwNotStarted() {
        require(started, "Presale is not started");
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

    fallback() external payable {
        contribute(msg.sender, msg.value);
    }

    function contribute(address _beneficiary, uint256 _value)
        internal
        onlyNotPaused
        throwNotStarted
        throwNotActive
        throwIfFinished
    {
        uint256 token_amount = _value / token_price;

        require(token_amount > 0, "invalid amount");

        uint256 contribute_amount = token_amount * token_price;
        uint256 current_contribution = contribution[_beneficiary];

        if (_value > contribute_amount) {
            uint256 refund_amount = _value - contribute_amount;
            payable(msg.sender).transfer(refund_amount);
            RefundContribution(refund_amount, current_contribution);
        }

        uint256 new_contribution = current_contribution + contribute_amount;
        require(max_contribution < new_contribution, "Invalid amount");
        uint256 new_total_contribution = total_contribution + contribute_amount;

        contribution[_beneficiary] = new_contribution;
        total_contribution = new_total_contribution;

        ContrubutionAdded(_value, new_total_contribution);
    }
}
