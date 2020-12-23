// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

/** 
 * Custom Data Types for ReclothesShop and PrivateReclothesShop Smart Contracts 
 */

/// @dev List of values for the different types of clothes.
enum CLOTH_TYPE {OTHER, TSHIRT, PANT, JACKET, DRESS, SHIRT} /// Default value: OTHER = 0.

/// @dev List of values for the different sizes of clothes.
enum CLOTH_SIZE {UNIQUE, XS, S, M, L, XL} /// Default value: UNIQUE = 0.

/// @dev List of values for the different status of clothes.
enum CLOTH_STATUS {SECOND_HAND, UPCYCLED, BRAND_NEW} /// Default value: SECOND_HAND = 0.

/// @dev Definition of the data structure of a certain amount of second-hand clothes.
/// @notice The second-hand clothes are managed in an aggregate form by type of cloth.
struct SecondHandClothes {
    CLOTH_TYPE clothType; 
    uint quantity;
}

/// @dev Definition of the data structure of a cloth for sale.
struct SaleableCloth {
    uint id; // Random generated from client-side perspective.
    uint price; // Specified in RSC tokens.
    CLOTH_TYPE clothType; 
    CLOTH_SIZE clothSize;
    CLOTH_STATUS clothStatus;
    string description;
    address buyer;
    uint timestamp;
    bytes info; // A hash of the external data related to the cloth item (e.g., a link to IPFS photo).
}

/// @dev Definition of the data structure for a box of second-hand clothes.
/// @notice The management of the SecondHandClothes takes place through mappings that refer to the unique id of the box.
struct Box {
    uint id; // Random generated from client-side perspective.
    uint timestamp;
    uint numberOfClothTypes;
    uint evaluationInToken;
    string description;
    address sender;
}