// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "remix_tests.sol"; // this import is automatically injected by Remix.
import "hardhat/console.sol";
import "../contracts/TokenPreSale.sol";

contract TokenPreSaleTest {
    TokenPreSale preSale;
  
    function beforeAll () public {
        preSale = new TokenPreSale(
            7500000,
            210000000000,
            0,
            240,
            block.number + 100
        );
    }

    function tryBuyTokens () public {
        console.log("Running checkWinningProposal");
        preSale.contribute();
        // Assert.equal(ballotToTest.winningProposal(), uint(0), "proposal at index 0 should be the winning proposal");
        // Assert.equal(ballotToTest.winnerName(), bytes32("candidate1"), "candidate1 should be the winner name");
    }
}