// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Char.sol";
import "./VerifySignature.sol";

contract CrowdSale {
    using SafeCast for uint256;

    VerifySignature public immutable ec = new VerifySignature();
    HeroesGPT public char_contract;

    address public immutable owner;
    address public immutable wallet;
    address public dex_address;
    address public server_address;
    uint256 public price = 1 * 10**18;

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _server, address _char, address _wallet) {
        server_address = _server;
        char_contract = HeroesGPT(_char);
        owner = msg.sender;
        wallet = _wallet;
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
    }

    function setServerAddress(address _newServer) external onlyOwner {
        server_address = _newServer;
    }

    function setDex(address _dex) external onlyOwner {
        dex_address = _dex;
    }

    function buyNative(string memory _uri, bytes memory _signature) external payable onlyNotContract {
        require(msg.value >= price, "Sent value is less than the price");

        bool verify = ec.verify(server_address, msg.sender, _uri, _signature);
        require(verify, "invalid signautre");

        uint256 change = msg.value - price;

        if (change > 0) {
            payable(msg.sender).transfer(change);
        }

        payable(wallet).transfer(price);

        uint256 newTokenId = char_contract.totalSupply() + 1;

        char_contract.safeMint(msg.sender, newTokenId, _uri);
    }

    // function buyUSDT(string memory _uri, bytes memory _signature, uint256 _amount) external {
    //     require(false, "not impl yet");
    // }

    function getPrice() public view returns (uint256) {
        return price;
    }
}
