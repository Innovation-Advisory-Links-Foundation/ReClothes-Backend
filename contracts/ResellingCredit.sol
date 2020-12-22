// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20.sol";

/// @title ERC20 Token used for buy/sell clothes in the Reclothes Shop platform.
/// @author LINKS Foundation
contract ResellingCredit is ERC20 {
    /// @notice Deploy a new ERC20 contract.
    /// @param _initialSupply The amount of RSC token to be initially mint.
    constructor(uint256 _initialSupply) ERC20("ResellingCredit", "RSC") {
        // ERC20 OZ mint method.
        _mint(msg.sender, _initialSupply);
    }
}