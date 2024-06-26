// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenPreSale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;

    IERC20 public immutable token;
    uint256 public immutable tokenPrice;
    uint256 public immutable targetMaximum;
    uint256 public immutable targetMinimum;
    uint256 public immutable cooldownPeriod;
    uint256 public immutable deadline;
    uint256 public immutable minContribution;
    uint256 public immutable maxContribution;

    uint256 public startBlock;
    uint256 public endBlock;
    uint256 public cooldownBlock;
    uint256 public deadlineBlock;

    bool public started;
    bool public finished;
    bool public finishedFallback;

    mapping(address => uint256) public contribution;
    mapping(address => bool) public claimState;

    uint256 public totalContribution;

    event SaleInitiated(uint256 startBlock, uint256 endBlock);
    event ContributionAdded(uint256 amount, uint256 newContribution);
    event Finished();
    event Claimed();
    event RefundContribution(uint256 amount);
    event TokenClaimed(uint256 amount);
    event RefundToken(uint256 amount);
    event FundSale(uint256 amount);
    event TopUpBalance(uint256 tokens, uint256 amount);

    modifier onlyWhenActive() {
        require(
            block.number >= startBlock && block.number < endBlock,
            "Presale is not active"
        );
        _;
    }

    modifier onlyWhenFinished() {
        require(finished, "Presale is not finished");
        _;
    }

    constructor(
        address _token,
        uint256 _tokenPrice,
        uint256 _targetMaximum,
        uint256 _targetMinimum,
        uint256 _cooldownPeriod,
        uint256 _deadline
    ) Ownable(msg.sender) {
        token = IERC20(_token);
        tokenPrice = _tokenPrice;
        targetMaximum = _targetMaximum;
        targetMinimum = _targetMinimum;
        cooldownPeriod = _cooldownPeriod;
        deadline = _deadline;

        minContribution = tokenPrice * targetMinimum;
        maxContribution = tokenPrice * targetMaximum;

        startBlock = block.number;
        endBlock = block.number;
        cooldownBlock = block.number;
        deadlineBlock = block.number;
    }

    function contribute() external payable onlyWhenActive nonReentrant {
        uint256 tokenAmount = msg.value / tokenPrice;
        require(tokenAmount > 0, "Invalid contribution amount");

        uint256 contributionAmount = tokenAmount * tokenPrice;
        uint256 refundAmount = msg.value - contributionAmount;

        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
            emit RefundContribution(refundAmount);
        }

        uint256 newContribution = contribution[msg.sender] + contributionAmount;
        require(
            newContribution <= maxContribution,
            "Contribution exceeds maximum limit"
        );

        contribution[msg.sender] = newContribution;
        totalContribution = totalContribution + contributionAmount;

        emit ContributionAdded(msg.value, newContribution);
    }

    function claim() external nonReentrant {
        require(started, "Sale not started");
        require(finished, "Sale not finished");
        require(block.number < deadlineBlock, "Claim deadline passed");
        require(block.number >= cooldownBlock, "Claim cooldown not ended");
        require(!claimState[msg.sender], "Already claimed");

        processClaim();

        claimState[msg.sender] = true;

        emit Claimed();
    }

    function initiatePresale(uint256 duration) external onlyOwner nonReentrant {
        require(!started, "Presale already started");

        startBlock = block.number + 1;
        endBlock = startBlock + duration;
        deadlineBlock = endBlock + deadline;

        started = true;

        token.safeTransferFrom(msg.sender, address(this), targetMaximum);

        emit SaleInitiated(startBlock, endBlock);
    }

    function finishSale() external nonReentrant {
        require(started, "Sale not started");
        require(!finished, "Sale already finished");
        require(
            block.number >= endBlock && block.number < deadlineBlock,
            "Invalid finish time"
        );

        finished = true;
        cooldownBlock = block.number + cooldownPeriod;

        processFinish();
        emit Finished();
    }

    function processClaim() private {
        uint256 currentContribution = contribution[msg.sender];

        if (totalContribution < minContribution) {
            payable(msg.sender).transfer(currentContribution);
            emit RefundContribution(currentContribution);
        } else {
            uint256 realContribution;

            if (totalContribution > maxContribution) {
                realContribution =
                    (currentContribution * maxContribution) /
                    totalContribution;
            } else {
                realContribution = currentContribution;
            }

            uint256 tokenAmount = realContribution / tokenPrice;
            uint256 spentAmount;

            if (totalContribution > maxContribution) {
                spentAmount =
                    (currentContribution * maxContribution) /
                    totalContribution +
                    1;
            } else {
                spentAmount = tokenAmount * tokenPrice;
            }

            if (currentContribution > spentAmount) {
                uint256 refundAmount = currentContribution - spentAmount;
                payable(msg.sender).transfer(refundAmount);
                emit RefundContribution(refundAmount);
            }

            if (tokenAmount > 0) {
                token.safeTransfer(msg.sender, tokenAmount);
                emit TokenClaimed(tokenAmount);
            }
        }
    }

    function processFinish() private {
        if (totalContribution < minContribution) {
            uint256 maxTokenAmount = maxContribution / tokenPrice;
            token.transfer(owner(), maxTokenAmount);
            emit RefundToken(maxTokenAmount);
        } else {
            uint256 fixContribution = totalContribution > maxContribution
                ? maxContribution
                : totalContribution;
            uint256 maxTokenAmount = maxContribution / tokenPrice;
            uint256 soldTokenAmount = fixContribution / tokenPrice;
            uint256 fundAmount = soldTokenAmount * tokenPrice;
            uint256 refundTokenAmount = maxTokenAmount - soldTokenAmount;

            if (fundAmount > 0) {
                payable(owner()).transfer(fundAmount);
                emit FundSale(fundAmount);
            }

            if (refundTokenAmount > 0) {
                token.transfer(owner(), refundTokenAmount);
                emit RefundToken(refundTokenAmount);
            }
        }
    }
}
