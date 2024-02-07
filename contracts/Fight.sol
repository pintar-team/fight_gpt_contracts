// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Effect.sol";
import "./Char.sol";
import "./ERC20.sol";
import "./VerifySignature.sol";

contract Fight {
    using SafeCast for uint256;

    Effect public contract_effects;
    HeroesGPT public contract_char_token;
    ERC20Token public contract_token;

    uint256 public waiting;
    uint256 public total_fights = 0;

    mapping(uint256 => uint256[2]) public fights;
    mapping(uint256 => uint8) public rounds;
    mapping(uint256 => uint256) public stakes;

    function join(
        uint256 _charID,
        uint256 _stake_amount,
        uint8 _rounds
    ) external {
        // TODO: add checers;
        add(_charID, _rounds, _stake_amount);
    }

    function commit(uint256 _fightid) external {
        // TODO: add checers;
    }

    function add(uint256 _id, uint8 _rounds, uint256 _stake) internal {
        if (waiting == 0) {
            waiting = _id;
        } else {
            uint256 opponent = waiting;
            total_fights++;

            fights[total_fights] = [_id, opponent];
        }

        rounds[_id] = _rounds;
        stakes[_id] = _stake;
    }
}
