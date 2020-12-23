// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20.sol";

/** 
 * @title An ERC20 Token used to incentivize the Dealer to dispatch the Customers' second-hand clothes to Recyclers 
 * to extract raw materials from worn clothes and use them to produce upcycled clothes.
 * @author LINKS Foundation.
 */
contract RegenerationCredit is ERC20 {
    /// @notice Deploy a new ERC20 contract using Open Zeppelin ERC20 Token standard.
    /// @param _initialSupply The starting amount of token.
    constructor(uint256 _initialSupply) ERC20("RegenerationCredit", "RGC") {
        _mint(msg.sender, _initialSupply);
    }
}