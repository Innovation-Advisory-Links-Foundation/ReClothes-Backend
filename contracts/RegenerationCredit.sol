// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20.sol";

/// @title ERC20 Token used as a reputation token for the Reclothes Dealer.
/// @author LINKS Foundation
/// @notice These tokens can be spent on external services (e.g., tax reduction, ...).
contract RegenerationCredit is ERC20 {
    /// @notice Deploy a new ERC20 contract.
    /// @param _initialSupply The amount of RGC token to be initially mint.
    constructor(uint256 _initialSupply) ERC20("RegenerationCredit", "RGC") {
        // ERC20 OZ mint method.
        _mint(msg.sender, _initialSupply);
    }
}