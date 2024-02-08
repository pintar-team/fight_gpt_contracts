// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Effect.sol";
import "./Char.sol";
import "./ERC20.sol";
import "./VerifySignature.sol";
import "./WaitList.sol";

contract Fight {
    using SafeCast for uint256;

    struct Lobby {
        uint256 id0;
        uint256 id1;
    }

    Effect public contract_effects;
    HeroesGPT public contract_char_token;
    ERC20Token public contract_token;
    WaitList public waiting = new WaitList();

    uint256 public total_fights = 0;
    uint8 public fee = 0;

    mapping(uint256 => Lobby) public fights;
    mapping(uint256 => uint8) public rounds;
    mapping(uint256 => uint256) public stakes;

    function join(
        uint256 _id,
        uint256 _stake,
        uint8 _rounds
    ) external {
        /// TODO: add checerks
        // TODO: add transfers.
        add(_id, _stake, _rounds);
    }

    function commit(uint256 _fightid, uint256 _wonid) external {
        /// TODO: add checerks.
        Lobby memory lobby = fights[_fightid];
        uint256 winnerid = (_wonid == lobby.id0) ? lobby.id0 : lobby.id1;
        uint256 loserid = (_wonid == lobby.id1) ? lobby.id1 : lobby.id0;
        uint256 winstake = stakes[winnerid];
        uint256 losestake = stakes[loserid];

        (
            uint256 potentialGain,
            uint256 platformFee,
            uint256 winnerGain
        ) = redistributeStakes(winstake, losestake);

        stakes[loserid] -= potentialGain;
        stakes[winnerid] += winnerGain;
    }

    function addWaitlist(uint256 _id) internal {
        waiting.add(_id);
        // TODO: add Events.
    }

    function startFight(uint256 _id, uint256 _opponent) internal {
        total_fights++;
        fights[total_fights] = Lobby(_id, _opponent);
        // TODO: add Events.
    }

     function updateRounds(uint256 _id) internal {
        if (rounds[_id] == 1) {
            pop(_id);
        } else {
            uint8 newRounds = rounds[_id] - 1;
            add(_id, stakes[_id], newRounds);
        }
    }

    function pop(uint256 _id) internal {
        // TODO: here transfer tokens back.
        rounds[_id] = 0;
        stakes[_id] = 0;
    }

    function add(
        uint256 _id,
        uint256 _stake,
        uint8 _rounds
    ) internal {
        if (waiting.hasEmpty()) {
            addWaitlist(_id);
        } else {
            uint256 opponent = waiting.get(0);

            waiting.pop();
            startFight(_id, opponent);
        }

        stakes[_id] = _stake;
        rounds[_id] = _rounds;
    }

    function redistributeStakes(uint256 _winner, uint256 _loser)
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 potentialGain = min(_winner, _loser);
        uint256 platformFee = (potentialGain * fee) / 100;
        uint256 winnerGain = potentialGain - platformFee;

        return (potentialGain, platformFee, winnerGain);
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a : b;
    }
}
