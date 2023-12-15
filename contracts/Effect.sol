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

    // item >> effects
    mapping(uint256 => EffectData) public effects;
    // charID >> effectID
    mapping(uint256 => uint256[]) public char_effect;
    // itemOwner >> itemID
    mapping(uint256 => uint256) public items_owner;

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
    }

    // can call only fight contract!s
    function mint(uint64[] memory _effects, uint8[] memory _number_effects) {
        require(_effects.length == _number_effects.length, "Invalid input params");

        uint256 total_supply = item_token.totalSupply() + 1;

        for (uint32 i = 0; i < _effects.length; i++) {
            uint256 tokenID = total_supply + i;
            uint64 effectID = _effects[i];
            uint8 effect_number = _number_effects[i];

            require(effect_number > 0, "Invalid effect_number");

            item_token.safeMint(_to, tokenID, Strings.toString(tokenID));
            effects[tokenID] = EffectData(effectsId, number_effects);
        }
    }

    function getEffect(uint256 _tokenID) public view returns (uint8 effects, uint64 effectId) {
        effects = effects[_tokenID].number_effects;
        effectId = effects[_tokenID].effectsId;
    }
}
