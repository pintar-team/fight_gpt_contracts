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

    uint256 public total_fights = 0;
    uint8 public fee = 0;

    uint256[10] public waiting;

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
        // TODO: add events;
    }

    function commit(uint256 _fightid, uint256 _wonid) external {
        uint256[2] memory lobby = fights[_fightid];
        uint256 winnerid = (_wonid == lobby[0]) ? lobby[0] : lobby[1];
        uint256 loserid = (_wonid == lobby[1]) ? lobby[1] : lobby[0];
        uint256 winstake = stakes[winnerid];
        uint256 losestake = stakes[loserid];

        (uint256 potentialGain, uint256 platformFee, uint256 winnerGain) = redistributeStakes(winstake, losestake);

        stakes[loserid] -= potentialGain;
        stakes[winnerid] += winnerGain;

        updateRounds(winnerid);
        updateRounds(loserid);
        // TODO: send fee for commiter!
    }

    function add(uint256 _id, uint8 _rounds, uint256 _stake) internal {
        if (isEmptyWaitlist()) {
            waiting.push(_id);
        } else {
            startFight(_id);
        }

        rounds[_id] = _rounds;
        stakes[_id] = _stake;
    }

    function startFight(uint256 _id) internal {
        total_fights++;

        fights[total_fights] = [_id, waiting];
        waiting = 0;
    }

    function updateRounds(uint256 _id) internal {
        if (rounds[_id] == 1) {
            pop(_id);
        } else {
            uint8 newRounds = rounds[_id] - 1;
            add(_id, newRounds, stakes[_id]);
        }
    }

    function pop(uint256 _id) internal {
        // TODO: here transfer tokens back.
        rounds[_id] = 0;
    }

    function redistributeStakes(uint256 _winner, uint256 _loser) public view returns (uint256, uint256, uint256) {
        uint256 potentialGain = min(_winner, _loser);
        uint256 platformFee = (potentialGain * fee) / 100;
        uint256 winnerGain = potentialGain - platformFee;

        return (potentialGain, platformFee, winnerGain);
    }

    function isEmptyWaitlist() public view returns (bool) {
        for(uint i = 0; i < waiting.length; i++) {
            if(waiting[i] != 0) {
                return false;
            }
        }

        return true;
    }

    function isFreeSpaceWaitList() public view returns (bool) {
        for(uint i = 0; i < waiting.length; i++) {
            if(waiting[i] == 0) {
                return true;
            }
        }

        return false;
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a : b;
    }
}
