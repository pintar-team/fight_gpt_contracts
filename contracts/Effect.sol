// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./Item.sol";
import "./Char.sol";


contract Effect {
    using SafeCast for uint256;

    struct EffectData {
        uint64 effectsId;
        uint8 number_effects;
    }

    address public immutable owner;

    HeroesGPT public char_token;
    Item public item_token;

    // tokens >> effects
    mapping(uint256 => EffectData) public effects;

    event ItemContractChanged(
        Item oldContract,
        Item newContract
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "sender is not owner");
        _;
    }

    constructor(address _item_contract, address _char_token) {
        item_token = Item(_item_contract);
        char_token = HeroesGPT(_char_token);
        owner = msg.sender;
    }

    function setItem(address _new_item_contract) external onlyOwner {
        Item new_tem_token = Item(_new_item_contract);
        emit ItemContractChanged(
            item_token,
            new_tem_token
        );

        item_token = new_tem_token;
    }

    function takeThePill(uint256 _charID, uint256 _itemID) external {
        require(char_token.ownerOf(_charID) == msg.sender, "sender is not char owner");

        uint64 effectsId = item_token.getEffectsID(_itemID);
        uint8 number_effects = item_token.getNumbersOfEffects(_itemID);

        item_token.burn(_itemID);
        effects[_charID] = EffectData(effectsId, number_effects);
    }
}
