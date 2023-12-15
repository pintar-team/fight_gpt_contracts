// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./Item.sol";


contract Effect {
    using SafeCast for uint256;

    Item public immutable item_token;
    address public immutable owner;

    event ItemContractChanged(
        address oldContract,
        address newContract
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "sender is not owner");
        _;
    }

    constructor(address _item_contract) {
        item_token = Item(_item_contract);
        owner = msg.sender;
    }

    function setItem(address _new_item_contract) external onlyOwner {
        emit ItemContractChanged(
            item_token,
            _new_item_contract
        );

        item_token = Item(_new_item_contract);
    }
}
