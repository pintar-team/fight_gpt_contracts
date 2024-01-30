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
    uint256 public min_stake = 100;
    uint256 public total_fights = 0;

    Effect public contract_effects;
    HeroesGPT public contract_char_token;
    ERC20Token public contract_token;

    Lobby public waiting;
    mapping(uint256 => Lobby) public fights;
    mapping(uint256 => address) public token_owners;

    event ReadyToFight(uint256 id, uint256 stake);

    event FightStarted(
        uint256 token0,
        uint256 token1,
        uint256 stake0,
        uint256 stake1
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

    function join(
        uint256 _charID,
        uint256 _stake_amount
    ) external onlyUnpaused onlyNotContract {
        require(_stake_amount > 0, "Stake should be more then zero");

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

            emit FightStarted(
                waited.token0,
                waited.token1,
                waited.stake0,
                waited.stake1
            );
        }
    }

    function commmit(uint256 _id) external onlyUnpaused onlyNotContract {}
}
