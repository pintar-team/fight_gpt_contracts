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

    HeroesGPT public char_token;
    Item public item_token;

    // item >> effects
    mapping(uint256 => EffectData) public effects;
    // charID >> itemIDs
    mapping(uint256 => uint256[]) public char_effect;
    // itemID >> itemOwner
    mapping(uint256 => address) public items_owner;

    event ItemContractChanged(Item oldContract, Item newContract);

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

    constructor(address _item_contract, address _char_token) {
        item_token = Item(_item_contract);
        char_token = HeroesGPT(_char_token);
    }

    function takeThePill(
        uint256 _charID,
        uint256 _itemID
    ) external onlyNotContract {
        require(
            char_token.ownerOf(_charID) == msg.sender,
            "sender is not char owner"
        );

        item_token.transferFrom(msg.sender, address(this), _itemID);
        items_owner[_itemID] = msg.sender;
        char_effect[_charID].push(_itemID);
    }

    function getBackItem(uint256 _itemID, uint256 _charID) external onlyNotContract {
        require(items_owner[_itemID] == msg.sender, "Sender is not owner");
        require(
            char_token.ownerOf(_charID) == msg.sender,
            "sender is not char owner"
        );

        address token_owner = items_owner[_itemID];
        item_token.transferFrom(address(this), token_owner, _itemID);
        removeEffect(_charID, _itemID);
        delete items_owner[_itemID];
    }

    //TODO: can call only miner!
    function batchMint(
        address _to,
        uint64[] memory _effects,
        uint8[] memory _number_effects
    ) external {
        require(
            _effects.length == _number_effects.length,
            "Invalid input params"
        );
        require(_to != address(0), "invalid recipient");

        uint256 total_supply = item_token.totalSupply() + 1;

        for (uint32 i = 0; i < _effects.length; i++) {
            uint256 tokenID = total_supply + i;
            uint64 effectID = _effects[i];
            uint8 effect_number = _number_effects[i];

            require(effect_number > 0, "Invalid effect_number");

            item_token.safeMint(_to, tokenID, Strings.toString(tokenID));
            effects[tokenID] = EffectData(effectID, effect_number);
        }
    }

    function getEffect(
        uint256 _tokenID
    ) public view returns (uint64 _effectId, uint8 _effects) {
        _effects = effects[_tokenID].number_effects;
        _effectId = effects[_tokenID].effectsId;
    }

    function getCharEffects(uint256 _charID) public view returns (uint64[] memory, uint8[] memory) {
        uint256[] storage effects_list = char_effect[_charID];
        uint256 length = effects_list.length;
        
        uint64[] memory effects_ids = new uint64[](length);
        uint8[] memory effects_nums = new uint8[](length);

        for (uint32 i = 0; i < length; i++) {
            uint256 item_id = effects_list[i];
            EffectData memory effectData = effects[item_id];

            effects_ids[i] = effectData.effectsId;
            effects_nums[i] = effectData.number_effects;
        }

        return (effects_ids, effects_nums);
    }

    function removeEffect(uint256 _charID, uint256 _itemID) internal {
        uint256[] storage effects_list = char_effect[_charID];
        uint256 length = effects_list.length;

        for (uint32 i = 0; i < length; i++) {
            if (effects_list[i] == _itemID) {
                effects_list[i] = effects_list[length - 1];
                effects_list.pop();
                break;
            }
        }
    }
}
