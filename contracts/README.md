# ReClothes Smart Contracts Specification
## Overview
ReClothes smart contracts specify a set of immutable transactions that can be performed to update a single ledger's state, shared between a fashion industry (*ReClothes Dealer*), companies operating in the recycling industry (*Recyclers*), and individuals interested in purchasing clothing and sustaining an eco-friendly behavior (*Customers*).

Management of on-chain roles and permissions allows regulating the notarization and automation of procedures on-chain: sending boxes of second-hand clothes, automating remuneration using tokens, and selling clothes.

Transactions performed between *ReClothes Dealer* and *Customers*, the movement of tokens and the grant/revoke of a role is publicly visible to anyone. However, the information relating to transactions performed between the ReClothes Dealer and Recyclers are published and executed off-chain in a confidential setting. The off-chain smart contracts are linked to publicly deployed smart contracts, the self-regulation in the control of quantities, and transparency in token swaps without revealing information relating to the exchange's object but only its amount.

You can find the complete documentation relative to a smart contract by clicking on the contract's `.sol` file. Figure 1 below shows a UML class-like diagram representing the architecture of the smart contracts.

## Architecture

<div align="center">
    <img 
        align="center" 
        src="../scArchitecture.svg" 
        alt="Architecture of ReClothes Smart Contracts"
    />
    </div>
<p align="center"> <i>Figure 1.</i> The Architecture of ReClothes Smart Contracts. </p>


* [ResellingCredit](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/ResellingCredit.sol): An ERC20 Token used to incentivize the Customer to send second-hand clothes boxes and buy clothes in the Dealers' Shop.
* [RegenerationCredit](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/RegenerationCredit.sol): An ERC20 Token used to incentivize the Dealer to dispatch the Customers' second-hand clothes to Recyclers to extract raw materials from worn clothes and use them to produce upcycled clothes.
* [ReclothesShopRoleManager](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/ReclothesShopRoleManager.sol): Handles the role-based access control for the ReClothes DApp. Extends the OpenZeppelin AccessControl smart contract assigning the `DEFAULT_ADMIN_ROLE` to the ReClothes Dealer. The ReClothes Dealer supervises the Recycler role. Customers are independent of the Dealer and Recyclers' perspective. The Recycler can only trigger the execution of private methods of a `PrivateReclothesShop.sol` smart contract. 
* [ReclothesShopDataTypes](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/ReclothesShopDataTypes.sol): Custom Data Types for ReclothesShop and PrivateReclothesShop smart contracts.
* [ReclothesShop](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/ReclothesShop.sol): Public core ReClothes on-chain business logic smart contract. This contract enables Customers to send boxes of second-hand clothes, buy new clothes, and enable the Dealer to evaluate the boxes and sell saleable (second-hand/upcycled) clothes. This contract guarantees data consistency across private interaction between Recyclers and Dealer, storing those interactions' available public output.
* [PrivateReclothesShop](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/PrivateReclothesShop.sol): Private core ReClothes on-chain business logic smart contract. This contract enables the Dealer to send boxes of second-hand clothes, buy new upcycled clothes, and enable the Recycler to evaluate the boxes and sell upcycled clothes. Guarantees data and transactions confidentiality when deployed in a privacy group created between two or more Orion nodes (Dealer and Recyclers). The contract is linked to the publicly deployed ReclothesShop, ResellingCredit and RegenerationCredit smart contracts.