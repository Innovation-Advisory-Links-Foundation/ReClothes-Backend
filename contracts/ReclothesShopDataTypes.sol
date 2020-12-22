// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

/** Data Types and Entities for Reclothes Shop smart contract */

/// @dev The list of possible values for the type of a specific cloth.
enum CLOTH_TYPE {OTHER, TSHIRT, PANT, JACKET, DRESS, SHIRT} /// Default value: OTHER = 0.

/// @dev The list of possible size values for a saleable cloth.
enum CLOTH_SIZE {UNIQUE, XS, S, M, L, XL} /// Default value: UNIQUE = 0.

/// @dev The list of possible status values for a saleable cloth.
enum CLOTH_STATUS {SECOND_HAND, UPCYCLED, BRAND_NEW} /// Default value: SECOND_HAND = 0.

/// @dev The second-hand clothes are aggregate by cloth type.
/// @notice The customer has to certify the amount of clothes aggregated by type without a single-cloth granularity.
struct SecondHandClothes {
    CLOTH_TYPE clothType; 
    uint quantity;
}

/// @dev The saleable clothes are uniquelly identified for reselling purposes.
struct SaleableCloth {
    uint id; // Random generated from client-side perspective.
    uint price; // The price in RSC tokens.
    CLOTH_TYPE clothType; 
    CLOTH_SIZE clothSize;
    CLOTH_STATUS clothStatus;
    string description;
    address buyer;
    uint timestamp;
    bytes info; // A hash of the external data related to the cloth item (e.g., photos, ...).
}

/// @dev A box of second-hand clothes.
/// @notice The clothes are recorded in a side mapping for ease their management.
struct Box {
    uint id; // Random generated from client-side perspective.
    uint timestamp;
    uint numberOfClothTypes;
    uint evaluationInToken;
    string description;
    address sender;
}