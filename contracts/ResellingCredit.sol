// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20.sol";

/**
 * @title An ERC20 Token used to incentivize the Customer to send second-hand clothes boxes and buy clothes in the Dealers' Shop.
 * @author LINKS Foundation.
*/
contract ResellingCredit is ERC20 {
    /// @notice Deploy a new ERC20 contract using Open Zeppelin ERC20 Token standard.
    /// @param _initialSupply The starting amount of token.
    constructor(uint256 _initialSupply) ERC20("ResellingCredit", "RSC") {
        _mint(msg.sender, _initialSupply);
    }
}