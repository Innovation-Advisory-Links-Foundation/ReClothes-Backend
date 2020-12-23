// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./AccessControl.sol";

/** 
 * @title Handles the role-based access control for the ReClothes DApp.
 * @author LINKS Foundation
 * @notice Extends the OpenZeppelin AccessControl smart contract assigning the `DEFAULT_ADMIN_ROLE` to the ReClothes Dealer.
 * The ReClothes Dealer supervises the Recycler role. The Dealer can evaluate boxes and sell clothes.
 * The Customers are independent of the Dealer and Recyclers' perspective. The Customer can send boxes of second-hand clothes and buy clothes.
 * The Recycler can only trigger the execution of private methods of a `PrivateReclothesShop.sol` smart contract on a private group with the Dealer.
 */
contract ReclothesShopRoleManager is AccessControl {
    /** Events */
    
    event RecyclerRoleGranted(address user);
    event CustomerRegistered(address user);
    event RecyclerRoleRevoked(address recycler);
    event CustomerUnregistered(address customer);

    /** Storage */
    /// @dev Hash string used as Recycler role identifier.
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");

    /// @dev Return true when the account belongs to a Customer; otherwise false.
    mapping(address => bool) public customers;
    
    /** Modifiers */
    
    /// @dev Evaluates true when the sender has the DEFAULT_ADMIN_ROLE role.
    modifier onlyReclothesDealer {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "NOT-DEALER");
        _;
    }
    
    /// @dev Evaluates true when the sender has the RECYCLER_ROLE role.
    modifier onlyRecycler {
        require(hasRole(RECYCLER_ROLE, _msgSender()), "NOT-RECYCLER");
        _;
    }
        
    /// @dev Evaluates true when the sender is a Customer.
    modifier onlyCustomer {
        require(customers[_msgSender()], "NOT-CUSTOMER");
        _;
    }
    
    /// @dev Evaluates true when the provided account has the DEFAULT_ADMIN_ROLE role.
    modifier isReclothesDealer(address _account) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _account), "NOT-DEALER");
        _;
    }
    
    /// @dev Evaluates true when the provided account has the RECYCLER_ROLE role.
    modifier isRecycler(address _account) {
        require(hasRole(RECYCLER_ROLE, _account), "NOT-RECYCLER");
        _;
    }
    
    /// @dev Evaluates true when the provided account belongs to a Customer.
    modifier isCustomer(address _account) {
        require(customers[_account], "NOT-CUSTOMER");
        _;
    }
    
    /// @dev Evaluates true when the provided account has not the DEFAULT_ADMIN_ROLE role.
    modifier isNotReclothesDealer(address _account) {
        require(!hasRole(DEFAULT_ADMIN_ROLE, _account), "ALREADY-DEALER");
        _;
    }
    
    /// @dev Evaluates true when the provided account has not the RECYCLER_ROLE role.
    modifier isNotRecycler(address _account) {
        require(!hasRole(RECYCLER_ROLE, _account), "ALREADY-RECYCLER");
        _;
    }
    
    /// @dev Evaluates true when the provided account does not belong to a Customer.
    modifier isNotCustomer(address _account) {
        require(!customers[_account], "ALREADY-CUSTOMER");
        _;
    }
    
    /** Methods */
    
    /**
     * @notice Grant the RECYCLER_ROLE to an account.
     * @param _userAccount An Ethereum EOA.
     */
    function grantRecyclerRole(address _userAccount) 
    external 
    onlyReclothesDealer {
        _grantRecyclerRole(_userAccount);
    }
    
    /// @notice Register the sender as a Customer.
    function registerAsCustomer() 
    external 
    {
        _registerAsCustomer(_msgSender());
    }
    
    /**
     * @notice Revoke the RECYCLER_ROLE to the provided Recycler' account.
     * @param _recycler An Ethereum EOA associated that has the RECYCLER_ROLE.
     */
    function revokeRecyclerRole(address _recycler) 
    external 
    onlyReclothesDealer {
        _revokeRecyclerRole(_recycler);
    }
 
    /// @notice Unregister the sender as a Customer.
    function renounceToCustomerRole() 
    external 
    onlyCustomer {
        _renounceToCustomerRole(_msgSender());
    }
    
    function _grantRecyclerRole(address _userAccount) 
    internal 
    isNotReclothesDealer(_userAccount) isNotRecycler(_userAccount) isNotCustomer(_userAccount) {
        // Grant the RECYCLER_ROLE to the provided EOA.
        grantRole(RECYCLER_ROLE, _userAccount);
        
        // Event emit.
        emit RecyclerRoleGranted(_userAccount);
    }

    function _registerAsCustomer(address _userAccount) 
    internal 
    isNotReclothesDealer(_userAccount) isNotRecycler(_userAccount) isNotCustomer(_userAccount) {
        // Storage update.
       customers[_userAccount] = true;
        
        // Event emit.
        emit CustomerRegistered(_userAccount);
    }
    
    function _revokeRecyclerRole(address _recycler) 
    internal 
    isRecycler(_recycler) {
        // Revoke the RECYCLER_ROLE to the provided Recycler' account.
        revokeRole(RECYCLER_ROLE, _recycler);
        
        // Event emit.
        emit RecyclerRoleRevoked(_recycler);
    }
    
    function _renounceToCustomerRole(address _customer) 
    internal 
    {
        // Storage update.
       customers[_customer] = false;
        
        // Event emit.
        emit CustomerUnregistered(_customer);
    }
}