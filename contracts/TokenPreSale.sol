// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "./ERC20.sol";

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

    bool public started = false;
    bool public finished = false;
    bool public finished_fallback = false;

    uint256 public total_contribution = 0;
    uint256 public start_block = block.number;
    uint256 public end_block = block.number;
    uint256 public cooldown_block = block.number;
    uint256 public deadline_block = block.number;

    // address > BNB amount
    mapping(address => uint256) public contribution;
    // address > maybe claimed
    mapping(address => bool) public claim_state;

    event SaleInitiated(
        uint256 start_block,
        uint256 end_block,
        uint256 min_contribution,
        uint256 max_contribution
    );
    event RefundContribution(uint256 amount, uint256 current_contribution);
    event ContrubutionAdded(uint256 amount, uint256 new_contribution);
    event TokenClaimed(uint256 amount);
    event RefundToken(uint256 amount);
    event FundSale(uint256 amount);
    event Finished();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier throwNotActive() {
        require(
            block.number >= start_block && block.number < end_block,
            "Presale is not active"
        );
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

    modifier throwIfStarted() {
        require(!started, "Presale is started");
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
        token_price = _token_price;
        target_maximum = _target_maximum;
        target_minimum = _target_minimum;
        min_contribution = _token_price * _target_minimum;
        max_contribution = _token_price * _target_maximum;
        cooldown = _cooldown;
        deadline = _deadline;
    }

    function contribute()
        external
        payable
        throwNotStarted
        throwNotActive
        throwIfFinished
    {
        require(msg.sender != address(0), "Zero token address");

        address _beneficiary = msg.sender;
        uint256 _value = msg.value;
        uint256 token_amount = _value / token_price;

        require(token_amount > 0, "invalid amount");

        uint256 contribute_amount = token_amount * token_price;
        uint256 current_contribution = contribution[_beneficiary];

        if (_value > contribute_amount) {
            uint256 refund_amount = _value - contribute_amount;
            payable(msg.sender).transfer(refund_amount);
            emit RefundContribution(refund_amount, current_contribution);
        }

        uint256 new_contribution = current_contribution + contribute_amount;
        require(max_contribution < new_contribution, "Invalid amount");
        uint256 new_total_contribution = total_contribution + contribute_amount;

        contribution[_beneficiary] = new_contribution;
        total_contribution = new_total_contribution;

        emit ContrubutionAdded(_value, new_total_contribution);
    }

    function claim()
        external
        throwNotStarted
        throwNotFinished
        throwIfDeadline
        throwIfCooldown
    {
        bool is_claimed = claim_state[msg.sender];
        require(!is_claimed, "Already claimed");

        uint256 current_contribution = contribution[msg.sender];
        bool is_underlow = total_contribution < min_contribution;

        if (is_underlow) {
            payable(msg.sender).transfer(current_contribution);
            emit RefundContribution(current_contribution, 0);
        } else {
            bool is_overflow = max_contribution < total_contribution;
            uint256 real_contribution = this.getRealContribution(
                is_overflow,
                current_contribution
            );
            uint256 token_amount = real_contribution / token_price;
            uint256 spend_amount = 0;

            if (is_overflow) {
                spend_amount = this.muldiv_up(
                    current_contribution,
                    max_contribution,
                    total_contribution
                );
            } else {
                spend_amount = token_amount * token_price;
            }

            if (current_contribution > spend_amount) {
                uint256 refund_amount = current_contribution - spend_amount;
                payable(msg.sender).transfer(refund_amount);
                emit RefundContribution(refund_amount, current_contribution);
            }

            if (token_amount > 0) {
                token.transfer(msg.sender, token_amount);
                emit TokenClaimed(token_amount);
            }
        }

        claim_state[msg.sender] = true;
    }

    function finishSale()
        external
        throwNotStarted
        throwNotEnded
        throwIfFinished
        throwIfDeadline
    {
        bool is_overflow = max_contribution < total_contribution;
        bool is_underlow = total_contribution < min_contribution;

        if (is_underlow) {
            uint256 max_token_amount = max_contribution / token_price;
            // TODO: replace to multisig wallet.
            token.transfer(owner, max_token_amount);
            emit RefundToken(max_token_amount);
        } else {
            uint256 fix_contribution = is_overflow
                ? max_contribution
                : total_contribution;
            uint256 max_token_amount = max_contribution / token_price;
            uint256 sold_token_amount = fix_contribution / token_price;
            uint256 fund_amount = sold_token_amount / token_price;
            uint256 refund_token_amount = max_token_amount - sold_token_amount;

            if (fund_amount > 0) {
                // TODO: replace to multisig wallet.
                payable(owner).transfer(fund_amount);
                emit FundSale(fund_amount);
            }

            if (refund_token_amount > 0) {
                // TODO: replace to multisig wallet.
                token.transfer(owner, refund_token_amount);
                emit RefundToken(refund_token_amount);
            }
        }

        cooldown_block = block.number + cooldown;
        emit Finished();
    }

    function fallbackRefund()
        external
        throwNotStarted
        throwNotDeadline
        throwIfFinished
    {
        require(!claim_state[msg.sender], "Already claimed");
        uint256 current_contribution = contribution[msg.sender];

        if (current_contribution > 0) {
            emit RefundContribution(current_contribution, 0);
            claim_state[msg.sender] = true;
            payable(msg.sender).transfer(current_contribution);
        }
    }

    function initiateSale(uint256 duration) external onlyOwner throwIfStarted {
        uint256 start = block.number + 1;
        uint256 end = start + duration;

        startSale(start, end);
    }

    function startSale(uint256 _startblock, uint256 _endblock) internal {
        require(block.number < _startblock, "Invalid start block");
        require(_startblock < _endblock, "Invalid end block");

        started = true;
        start_block = _startblock;
        end_block = _endblock;
        deadline_block = _endblock + deadline;
        min_contribution = token_price * target_minimum;
        max_contribution = token_price * target_maximum;

        emit SaleInitiated(
            _startblock,
            _endblock,
            min_contribution,
            max_contribution
        );
    }

    function muldiv(
        uint256 a,
        uint256 b,
        uint256 c
    ) public pure returns (uint256) {
        uint256 num = a * b;
        uint256 hv = num / c;

        return hv;
    }

    function muldiv_up(
        uint256 a,
        uint256 b,
        uint256 c
    ) public pure returns (uint256) {
        uint256 num = a * b;
        uint256 num_p = num + c;
        uint256 num_p_1 = num_p - 1;
        uint256 hv = num_p_1 / c;

        return hv;
    }

    function getRealContribution(bool is_overflow, uint256 current_contribution)
        public
        view
        returns (uint256)
    {
        if (is_overflow) {
            return
                muldiv(
                    current_contribution,
                    max_contribution,
                    total_contribution
                );
        }

        return current_contribution;
    }
}
