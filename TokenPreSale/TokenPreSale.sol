// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract TokenPreSale {
    uint256 public deadline_block;
    address public token_addr;
    uint256 public start_token_price;
    bool public isPaused;
    address public owner;

    // address > BNB amount
    mapping(address => uint256) public contribution;

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

    modifier onlyActivePresale() {
        // TODO: add end Presale by sale amount
        require(block.number <= deadline_block, "Presale has ended");
        _;
    }

    constructor(
        uint256 _deadline_block,
        address _token_addr,
        uint256 _start_token_price
    ) {
        deadline_block = block.number + _deadline_block;
        token_addr = _token_addr;
        start_token_price = _start_token_price;
        owner = msg.sender;
    }

    function buyTokensForBNB() external onlyNotPaused onlyActivePresale {
        require(msg.value > 0, "Invalid amount");
    }

    function claimTokens() external {}

    function pausePresale() external onlyOwner {
        require(!isPaused, "Presale is already paused");
        isPaused = true;
        emit PresalePaused(block.timestamp);
    }

    function unpausePresale() external onlyOwner {
        require(isPaused, "Presale is not paused");
        isPaused = false;
        emit PresaleUnpaused(block.timestamp);
    }
}
