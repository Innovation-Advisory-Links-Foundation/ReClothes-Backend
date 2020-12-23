// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ReclothesShop.sol";

/** 
 * @title Private core ReClothes on-chain business logic smart contract. This contract enables the Dealer to send boxes of second-hand clothes, 
 * buy new upcycled clothes, and enable the Recycler to evaluate the boxes and sell upcycled clothes. 
 * This contract guarantees data and transactions confidentiality when deployed in a privacy group created between two or more Orion nodes (Dealer and Recyclers).
 * This contract is linked to the publicly deployed ReclothesShop, ResellingCredit and RegenerationCredit smart contracts.
 * @author LINKS Foundation.
 */

contract PrivateReclothesShop {
    /** Events */
    event SecondHandBoxSent(uint boxId, string description, CLOTH_TYPE[] clothesTypes, uint[] quantities);
    event SecondHandBoxEvaluated(uint boxId, uint rgcAmount);
    event SaleableClothAdded(uint clothId, uint rscPrice, CLOTH_TYPE clothType, CLOTH_SIZE clothSize, CLOTH_STATUS clothStatus, string description, bytes extClothDataHash);
    event SaleableClothSold(uint clothId, uint rscPrice);

    /** Storage */
    
    ResellingCredit public resellingCreditInstance;
    RegenerationCredit public regenerationCreditInstance;
    ReclothesShop public reclothesShopInstance;

    /// @dev Associate a price (expressed in RGC tokens) for every possible cloth type.
    mapping(CLOTH_TYPE => uint) public confidentialClothTypeToEvaluationPrice;

    /// @dev Return the Box associated to its unique numeric identifier; otherwise an empty Box.
    mapping(uint => Box) public idToBox;

    /// @dev Return the list of SecondHandClothes associated to a Box; otherwise an empty array.
    mapping(uint => SecondHandClothes[]) public boxToSecondHandClothes;

    /// @dev Return the SaleableCloth associated to its unique numeric identifier; otherwise an empty SaleableCloth.
    mapping(uint => SaleableCloth) public idToSaleableCloth;

    /** Modifiers */

    /// @dev Evaluates true when the sender has the DEFAULT_ADMIN_ROLE role.
    modifier onlyReclothesDealer {
        require(reclothesShopInstance.hasRole(reclothesShopInstance.DEFAULT_ADMIN_ROLE(), msg.sender), "NOT-DEALER");
        _;
    }

    /// @dev Evaluates true when the sender has the RECYCLER_ROLE role.
    modifier onlyRecycler {
        require(reclothesShopInstance.hasRole(reclothesShopInstance.RECYCLER_ROLE(), msg.sender), "NOT-RECYCLER");
        _;
    }
    
    /// @dev Evaluate true when the provided identifier is greater than zero and it is not used for another Box.
    modifier isValidBoxId(uint _id) {
        require(_id > 0, "ZERO-ID");
        require(idToBox[_id].id == 0, "ALREADY-USED-ID");
        _;
    }
    
    /// @dev Evaluate true when the provided identifier is greater than zero and it is not used for another SaleableCloth.
    modifier isValidClothId(uint _id) {
        require(_id > 0, "ZERO-ID");
        require(idToSaleableCloth[_id].id == 0, "ALREADY-SALEABLE-CLOTH");
        _;
    }
    
    /// @dev Evaluate true when the provided identifier is used for a Box.
    modifier isBox(uint _boxId) {
        require(idToBox[_boxId].id == _boxId, "NOT-BOX");
        _;
    }

    /// @dev Avoid inconsistency between clothes types and quantities arrays.
    modifier areTypesAndQuantitiesArrayInvalid(CLOTH_TYPE[] calldata _clothesTypes, uint[] calldata _quantities) {
        require(_clothesTypes.length == _quantities.length && _clothesTypes.length <= 6, "INVALID-ARRAYS");
        _;
    }

    /** Methods */
    
    /**
     * @notice Deploy a new instance of Private ReclothesShop smart contract.
     * @param _resellingCreditAddress The address of the ResellingCredit smart contract.
     * @param _regenerationCreditAddress The address of the RegenerationCredit smart contract.
     */

    /// @notice Deploy a new Private Reclothes Shop smart contract for confidential interactions between Recycler and Reclothes Dealer.
    /// @param _resellingCreditAddress The address of the publicly deployed ResellingCredit smart contract.
    /// @param _regenerationCreditAddress The address of the publicly deployed RegenerationCredit smart contract.
    /// @param _reclothesShopAddress The address of the publicly deployed ReclothesShop smart contract.
    /// @param _confidentialPricingList A list of confidential evaluation prices in RGC tokens for each cloth type.
    constructor(
        address _resellingCreditAddress, 
        address _regenerationCreditAddress, 
        address _reclothesShopAddress,
        uint[] memory _confidentialPricingList
    ) {
        // Setup the publicly deployed smart contract instances.
        resellingCreditInstance = ResellingCredit(_resellingCreditAddress);
        regenerationCreditInstance = RegenerationCredit(_regenerationCreditAddress);
        reclothesShopInstance = ReclothesShop(_reclothesShopAddress);

        // Setup confidential pricing list.
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.OTHER] = _confidentialPricingList[0];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.TSHIRT] = _confidentialPricingList[1];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.PANT] = _confidentialPricingList[2];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.JACKET] = _confidentialPricingList[3];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.DRESS] = _confidentialPricingList[4];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.SHIRT] = _confidentialPricingList[5];
    }
    
    /**
     * @notice Send second-hand clothes Box from the Dealer.
     * @param _boxId The unique numeric id used for identifying the box.
     * @param _description A short description of the box content.
     * @param _clothesTypes The clothes types which are contained in the box.
     * @param _quantities A quantity for each cloth type contained in the box.
     */
    function sendBoxForEvaluation(
        uint _boxId, 
        string calldata _description,
        CLOTH_TYPE[] calldata _clothesTypes, 
        uint[] calldata _quantities
    ) 
    external 
    onlyReclothesDealer isValidBoxId(_boxId) areTypesAndQuantitiesArrayInvalid(_clothesTypes, _quantities) {
        Box memory secondHandClothesBox = Box(
            _boxId, 
            block.timestamp, /// @dev Using "block.timestamp" here is safe because it is not involved in critical time constraints operations.
            _clothesTypes.length,
            0, 
            _description, 
            msg.sender
        );

        // Update storage.
        idToBox[_boxId] = secondHandClothesBox;

        // Event emit.
        emit SecondHandBoxSent(_boxId, _description, _clothesTypes, _quantities);

        // Create the SecondHandClothes array for the box clothes.
        for (uint i = 0; i < _clothesTypes.length; i++) {
            require(_quantities[i] > 0, "ZERO-QUANTITY");

            // Check the Dealer inventory to check availability of clothes quantities.
            require(reclothesShopInstance.inventory(_clothesTypes[i]) >= _quantities[i], "INVALID-INVENTORY-AMOUNT");

            boxToSecondHandClothes[_boxId].push(
                SecondHandClothes(CLOTH_TYPE(_clothesTypes[i]), _quantities[i])
            );
        }
    }
    
    /**
     * @notice Evaluate a box of second-hand clothes and remunerate the Dealer with RGC tokens.
     * @dev RGC tokens' allowance from Recycler to PrivateReclothesShop must satisfy the evaluation made with the pricing list plus the extra amount.
     * @param _boxId The unique numeric id used for identifying the box.
     * @param _extraAmountRGC An additional remuneration in RGC tokens for the box sender.
     */
    function evaluateBox(uint _boxId, uint _extraAmountRGC) 
    external 
    isBox(_boxId)
    onlyRecycler {
        require(idToBox[_boxId].evaluationInToken == 0, "ALREADY-EVALUATED");
        
        // Estimation of the amount of RGC tokens to be transferred from the Recycler to the Dealer.
        uint rgcAmount = _extraAmountRGC;
        SecondHandClothes[] memory secondHandClothes = boxToSecondHandClothes[_boxId];
        
        for (uint i = 0; i < secondHandClothes.length; i++) {
            rgcAmount += confidentialClothTypeToEvaluationPrice[secondHandClothes[i].clothType] * secondHandClothes[i].quantity;
        }
        
        // Storage update.
        idToBox[_boxId].evaluationInToken = rgcAmount;

        // Event emit.
        emit SecondHandBoxEvaluated(_boxId, rgcAmount);
    }

    /**
     * @notice Sell an upcycled cloth to the ReClothes Dealer.
     * @dev Requires the confidential transaction hash relating to the confidential transaction sent by the Dealer for buying the cloth from a Recycler.
     * @param _clothId The unique numeric id used for identifying the SaleableCloth.
     * @param _rscPrice The price of the SaleableCloth expressed in RSC tokens.
     * @param _clothType The type of cloth to sell.
     * @param _clothSize The size of cloth to sell.
     * @param _description A short description of the cloth.
     * @param _extClothDataHash A hash of external information related to the dress to sell (e.g., link to the cloth photo).
     */
    function sellUpcycledCloth(
        uint _clothId, 
        uint _rscPrice, 
        CLOTH_TYPE _clothType, 
        CLOTH_SIZE _clothSize,
        string calldata _description,
        bytes calldata _extClothDataHash
    ) 
    external
    isValidClothId(_clothId)
    onlyRecycler {
        require(_rscPrice > 0, "INVALID-PRICE");

        SaleableCloth memory saleableCloth = SaleableCloth(
            _clothId, 
            _rscPrice,
            CLOTH_TYPE(_clothType), 
            _clothSize, 
            CLOTH_STATUS.UPCYCLED, 
            _description, 
            address(0x0),
            block.timestamp, /// @dev Using "block.timestamp" here is safe because it is not involved in critical time constraints operations.
            _extClothDataHash
        );

        // Storage update.
        idToSaleableCloth[_clothId] = saleableCloth;

        // Event emit.
        emit SaleableClothAdded(_clothId, _rscPrice, _clothType, _clothSize, CLOTH_STATUS.UPCYCLED, _description, _extClothDataHash);
        
        require(reclothesShopInstance.inventory(_clothType) > 0, "INVENTORY-ZERO-QUANTITY");
    }
    
    /**
     * @notice Buy a cloth from the Recycler.
     * @param _clothId The unique numeric id used for identifying the SaleableCloth.
     */
    function buyCloth(uint _clothId) 
    external 
    onlyReclothesDealer {
        require(idToSaleableCloth[_clothId].id == _clothId, "INVALID-CLOTH");
        require(idToSaleableCloth[_clothId].buyer == address(0x0), "ALREADY-SOLD");
        
        // Storage update.
        idToSaleableCloth[_clothId].buyer = msg.sender;
        
        // Event emit.
        emit SaleableClothSold(_clothId, idToSaleableCloth[_clothId].price);
    }
}
