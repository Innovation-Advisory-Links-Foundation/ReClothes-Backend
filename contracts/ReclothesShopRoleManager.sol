// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <=0.7.0;

import "./AccessControl.sol";

/// @title Allows the dynamic management for each role used in the Reclothes Shop smart contract business logic.
/// @author LINKS Foundation
/// @notice This contract extends OZ AccessControl giving a DEFAULT_ADMIN_ROLE to Reclothes Dealer to handle Recycler role. The Customer role is managed independently for each user.
/// @notice The Customer role is assigned to an external user that can send boxes for evaluation and buy new clothes.
/// @notice The Recycler role is assigned to an internal partner/industry which will confidentially transact with the Reclothes Dealer on boxes of upcycled clothes.
contract ReclothesShopRoleManager is AccessControl {
    /** Events */
    
    event RecyclerRoleGranted(address user);
    event CustomerRegistered(address user);
    event RecyclerRoleRevoked(address recycler);
    event CustomerUnregistered(address customer);

    /** Storage */
    
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE"); /// @dev The hash which identifies the Recycler role.

    /// @dev Associate a true value to an EOA when belongs to a customer; otherwise false.
    mapping(address => bool) public customers;
    
    /** Modifiers */
    
    /// @dev Strict condition which evaluates true only if the sender has the DEFAULT_ADMIN_ROLE.
    modifier onlyReclothesDealer {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "NOT-DEALER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the sender has the RECYCLER_ROLE.
    modifier onlyRecycler {
        require(hasRole(RECYCLER_ROLE, _msgSender()), "NOT-RECYCLER");
        _;
    }
        
    /// @dev Strict condition which evaluates true only if the sender has the CUSTOMER_ROLE.
    modifier onlyCustomer {
        require(customers[_msgSender()], "NOT-CUSTOMER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given account is associated to the DEFAULT_ADMIN_ROLE.
    modifier isReclothesDealer(address _account) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _account), "NOT-DEALER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given account is associated to the RECYCLER_ROLE.
    modifier isRecycler(address _account) {
        require(hasRole(RECYCLER_ROLE, _account), "NOT-RECYCLER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given account is associated to the CUSTOMER_ROLE.
    modifier isCustomer(address _account) {
        require(customers[_account], "NOT-CUSTOMER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given account isn't associated to the DEFAULT_ADMIN_ROLE.
    modifier isNotReclothesDealer(address _account) {
        require(!hasRole(DEFAULT_ADMIN_ROLE, _account), "ALREADY-DEALER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given account isn't associated to the RECYCLER_ROLE.
    modifier isNotRecycler(address _account) {
        require(!hasRole(RECYCLER_ROLE, _account), "ALREADY-RECYCLER");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given account isn't associated to the CUSTOMER_ROLE.
    modifier isNotCustomer(address _account) {
        require(!customers[_account], "ALREADY-CUSTOMER");
        _;
    }
    
    /** Methods */
    
    /// @notice Register a new Recycler in to the system.
    /// @param _userAccount The EOA of the user that must be added as recycler.
    function grantRecyclerRole(address _userAccount) 
    external 
    onlyReclothesDealer {
        _grantRecyclerRole(_userAccount);
    }
    
    /// @notice Assign the Customer role to the sender
    function registerAsCustomer() 
    external 
    {
        _registerAsCustomer(_msgSender());
    }
    
    /// @notice Remove a Recycler user from the system.
    /// @param _recycler The EOA of the recycler that must be removed.
    function revokeRecyclerRole(address _recycler) 
    external 
    onlyReclothesDealer {
        _revokeRecyclerRole(_recycler);
    }
 
    /// @notice Removes the Customer role from the sender.
    function renounceToCustomerRole() 
    external 
    onlyCustomer {
        _renounceToCustomerRole(_msgSender());
    }
    
    function _grantRecyclerRole(address _userAccount) 
    internal 
    isNotReclothesDealer(_userAccount) isNotRecycler(_userAccount) isNotCustomer(_userAccount) {
        // Grant the RECYCLER_ROLE to the user account.
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
        // Revoke the RECYCLER_ROLE from the recycler account.
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