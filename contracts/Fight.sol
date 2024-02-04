// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./Effect.sol";
import "./Char.sol";
import "./ERC20.sol";
import "./VerifySignature.sol";

contract Fight {
    using SafeCast for uint256;

    struct Lobby {
        uint256 token0;
        uint256 token1;
        uint256 stake0;
        uint256 stake1;
    }

    VerifySignature public immutable ec = new VerifySignature();

    bool public pause = false;
    uint256 public total_fights = 0;
    uint8 public max_rounds = 1;
    uint8 public fee;
    address public server_address;
    address public wallet;

    Effect public contract_effects;
    HeroesGPT public contract_char_token;
    ERC20Token public contract_token;

    Lobby public waiting;

    mapping(uint256 => Lobby) public fights;
    mapping(uint256 => uint8) public rounds;
    mapping(uint256 => address) public token_owners;

    event ReadyToFight(uint256 id, uint256 stake);

    event FightStarted(
        uint256 token0,
        uint256 token1,
        uint256 stake0,
        uint256 stake1
    );

    event FightFinished(
        uint256 fightID,
        uint256 winnerID,
        address winnerAddress,
        uint256 amount
    );

    modifier onlyUnpaused() {
        require(!pause, "contract on pause");
        _;
    }

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

    constructor(
        address _wallet,
        address _server,
        uint8 _fee,
        address _effects,
        address _char,
        address _token
    ) {
        wallet = _wallet;
        server_address = _server;
        fee = _fee;
        contract_effects = Effect(_effects);
        contract_char_token = HeroesGPT(_char);
        contract_token = ERC20Token(_token);
    }

    function join(
        uint256 _charID,
        uint256 _stake_amount,
        uint8 _rounds
    ) external onlyUnpaused onlyNotContract {
        require(_stake_amount > 0, "Stake should be more then zero");
        require(_rounds <= max_rounds, "rounds is not valid");

        address token_owner = contract_char_token.ownerOf(_charID);

        contract_char_token.transferFrom(msg.sender, address(this), _charID);
        contract_token.transferFrom(msg.sender, address(this), _stake_amount);

        if (waiting.token0 == 0 && waiting.token1 == 0) {
            waiting = Lobby(_charID, 0, _stake_amount, 0);
            token_owners[_charID] = token_owner;

            emit ReadyToFight(_charID, _stake_amount);
        } else {
            Lobby memory waited = waiting;

            waited.token1 = _charID;
            waited.stake1 = _stake_amount;

            total_fights += 1;

            fights[total_fights] = waited;
            token_owners[_charID] = token_owner;
            waiting = Lobby(0, 0, 0, 0);
            rounds[_charID] = _rounds;

            emit FightStarted(
                waited.token0,
                waited.token1,
                waited.stake0,
                waited.stake1
            );
        }
    }

    function commmit(
        uint256 _fight_id,
        uint256 _token_won,
        bytes memory _signature
    ) external onlyUnpaused onlyNotContract {
        Lobby memory lobby = fights[_fight_id];
        string memory payload = concatenate(
            _fight_id,
            lobby.token0,
            lobby.token1,
            lobby.stake0,
            lobby.stake1,
            _token_won
        );
        bool verify = ec.verify(
            server_address,
            msg.sender,
            payload,
            _signature
        );

        require(verify, "invalid signautre");
        require(
            _token_won == lobby.token0 || _token_won == lobby.token1,
            "invalid won token id"
        );

        (
            uint256 winnerGain,
            uint256 loserReturn,
            uint256 platformFee
        ) = calculateAmount(lobby.stake0, lobby.stake1);

        address owner0 = token_owners[lobby.token0];
        address owner1 = token_owners[lobby.token1];

        if (_token_won == lobby.token0) {
            contract_token.transfer(owner0, winnerGain);
            contract_token.transfer(owner1, loserReturn);

            emit FightFinished(_fight_id, _token_won, owner0, winnerGain);
        } else if (_token_won == lobby.token1) {
            contract_token.transfer(owner1, winnerGain);
            contract_token.transfer(owner0, loserReturn);

            emit FightFinished(_fight_id, _token_won, owner1, winnerGain);
        } else {
            revert("Invalid sig or payload");
        }

        contract_token.transfer(wallet, platformFee);

        delete token_owners[lobby.token1];
        delete token_owners[lobby.token0];

        /// TODO: make mint items
    }

    function updateRounds(uint256 _token) internal {
        if (rounds[_token] == 1) {
            delete rounds[_token];
            delete token_owners[_token];
        } else {
            --rounds[_token];
        }
    }

    function calculateAmount(
        uint256 stakeAmount0,
        uint256 stakeAmount1
    )
        public
        view
        returns (uint256 winnerGain, uint256 loserReturn, uint256 platformFee)
    {
        uint256 minAmount = min(stakeAmount0, stakeAmount1);
        uint256 potentialGain = minAmount * 2;
        platformFee = (potentialGain * fee) / 100;
        winnerGain = potentialGain - platformFee;
        loserReturn = max(stakeAmount1, stakeAmount0) - minAmount;

        return (winnerGain, loserReturn, platformFee);
    }

    function concatenate(
        uint256 fight_id,
        uint256 token0,
        uint256 token1,
        uint256 stake0,
        uint256 stake1,
        uint256 token_won
    ) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    uintToString(fight_id),
                    uintToString(token0),
                    uintToString(token1),
                    uintToString(stake0),
                    uintToString(stake1),
                    uintToString(token_won)
                )
            );
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a : b;
    }

    function uintToString(uint256 value) internal pure returns (string memory) {
        return Strings.toString(value);
    }
}
