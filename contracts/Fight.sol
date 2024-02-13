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
    mapping(uint256 => address) public token_owners;

    constructor(
        uint8 _fee,
        address _effects,
        address _char,
        address _token
    ) {
        fee = _fee;
        contract_effects = Effect(_effects);
        contract_char_token = HeroesGPT(_char);
        contract_token = ERC20Token(_token);
    }

    function join(
        uint256 _id,
        uint256 _stake,
        uint8 _rounds
    ) external {
        require(_stake > 0, "Stake should be larger 0");
        require(_rounds > 0, "rounds is not valid");

        address token_owner = contract_char_token.ownerOf(_id);

        require(token_owner == msg.sender, "invalid tokens owner");

        contract_char_token.transferFrom(token_owner, address(this), _id);
        contract_token.transferFrom(token_owner, address(this), _stake);

        add(_id, _stake, _rounds, token_owner);
    }

    function claim(uint256 _id) external {
        address owner = token_owners[_id];

        require(owner == msg.sender || owner == address(0), "invalid owner");

        pop(_id, owner);
    }

    function commit(uint256 _fightid, uint256 _wonid) external {
        Lobby memory lobby = fights[_fightid];

        require(lobby.id1 == 0 || lobby.id0 == 0, "invalid fight id");

        uint256 loserid = (_wonid == lobby.id1) ? lobby.id0 : lobby.id1;
        uint256 winstake = stakes[_wonid];
        uint256 loserstake = stakes[loserid];

        (
            uint256 potentialGain,
            uint256 platformFee,
            uint256 winnerGain
        ) = redistributeStakes(winstake, loserstake);

        stakes[loserid] -= potentialGain;
        stakes[_wonid] += winnerGain;

        updateRounds(loserid);
        updateRounds(_wonid);

        contract_token.transfer(msg.sender, platformFee);
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
        address owner = token_owners[_id];

        if (rounds[_id] == 1) {
            pop(_id, owner);
        } else {
            uint8 newRounds = rounds[_id] - 1;
            add(_id, stakes[_id], newRounds, owner);
        }
    }

    function pop(uint256 _id, address _owner) internal {
        contract_token.transfer(_owner, stakes[_id]);
        contract_char_token.transferFrom(address(this), _owner, _id);

        rounds[_id] = 0;
        stakes[_id] = 0;
        delete token_owners[_id];
    }

    function add(
        uint256 _id,
        uint256 _stake,
        uint8 _rounds,
        address _owner
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
        token_owners[_id] = _owner;
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
