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
        uint256 token0;
        uint256 token1;
    }

    Effect public contract_effects;
    HeroesGPT public contract_char_token;
    ERC20Token public contract_token;
    WaitList public waiting;

    uint256 public total_fights = 0;
    uint8 public fee = 0;

    mapping(uint256 => uint256[2]) public fights;
    mapping(uint256 => uint8) public rounds;
    mapping(uint256 => uint256) public stakes;

    function join(uint256 _id, uint256 _stake, uint8 _rounds) external {
        /// TODO: add checerks
    }

    function redistributeStakes(uint256 _winner, uint256 _loser) public view returns (uint256, uint256, uint256) {
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
