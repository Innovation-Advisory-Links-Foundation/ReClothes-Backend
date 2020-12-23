// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ResellingCredit.sol";
import "./RegenerationCredit.sol";
import "./ReclothesShopRoleManager.sol";
import "./ReclothesShopDataTypes.sol";

/** 
 * @title Public core ReClothes on-chain business logic smart contract. This contract enables Customers to send boxes of second-hand clothes, 
 * buy new clothes, and enable the Dealer to evaluate the boxes and sell saleable (second-hand/upcycled) clothes. 
 * This contract guarantees data consistency across private interaction between Recyclers and Dealer, storing those interactions' 
 * available public output.
 * @author LINKS Foundation.
 */
contract ReclothesShop is ReclothesShopRoleManager {
    /** Events */
    
    event SecondHandBoxSent(uint boxId, string description, CLOTH_TYPE[] clothesTypes, uint[] quantities);
    event SecondHandBoxEvaluated(uint boxId, uint rscAmount);
    event SecondHandClothesStored(CLOTH_TYPE clothType, uint quantity);
    event SaleableClothAdded(uint clothId, uint rscPrice, CLOTH_TYPE clothType, CLOTH_SIZE clothSize, CLOTH_STATUS clothStatus, string description, bytes extClothDataHash);
    event SaleableClothSold(uint clothId, uint rscPrice);
    event ConfidentialUpcycledClothOnSale(uint clothId, string confidentialTxHash);
    event ConfidentialBoxSent(CLOTH_TYPE[] clothesTypes, uint[] quantities, string confidentialTxHash);
    event ConfidentialTokenTransfer(address sender, address receiver, uint amount, string confidentialTxHash);

    /** Storage */
    
    ResellingCredit public resellingCreditInstance;
    RegenerationCredit public regenerationCreditInstance;
    address public reclothesDealer;
    
    /// @dev Associate a price (expressed in RSC tokens) for every possible cloth type.
    mapping(CLOTH_TYPE => uint) public clothTypeToEvaluationPrice;
    
    /// @dev Return the Box associated to its unique numeric identifier; otherwise an empty Box.
    mapping(uint => Box) public idToBox;

    /// @dev Return the list of SecondHandClothes associated to a Box; otherwise an empty array.
    mapping(uint => SecondHandClothes[]) public boxToSecondHandClothes;

    /// @dev Return the SaleableCloth associated to its unique numeric identifier; otherwise an empty SaleableCloth.
    mapping(uint => SaleableCloth) public idToSaleableCloth;

    /// @dev Associate a quantity for every possible cloth type (i.e., the clothes are aggregated by cloth type inside the Dealer inventory).
    mapping(CLOTH_TYPE => uint) public inventory;
    
    /// @dev Return the list of unique identifiers for each Box sent by a Customer; otherwise an empty array.
    mapping(address => uint[]) public customerToBoxesIds;

    /// @dev Return the list of unique identifiers for each SaleableClothes purchased by a Customer; otherwise an empty array.
    mapping(address => uint[]) public customerToPurchasedClothesIds;

    /// @dev Store every SaleableClothes unique identifier.
    uint[] private _saleableClothesIds;

    /** Modifiers */

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
     * @notice Deploy a new instance of ReclothesShop smart contract.
     * @param _resellingCreditAddress The address of the ResellingCredit smart contract.
     * @param _regenerationCreditAddress The address of the RegenerationCredit smart contract.
     */
    constructor(
        address _resellingCreditAddress, 
        address _regenerationCreditAddress
    ) {
        // Setup the role for the Reclothes Dealer.
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        reclothesDealer = msg.sender;
        
        // Setup ResellingCredit Token smart contract instance.
        resellingCreditInstance = ResellingCredit(_resellingCreditAddress);

        // Setup RegenerationCredit Token smart contract instance.
        regenerationCreditInstance = RegenerationCredit(_regenerationCreditAddress);
        
        // Standard pricing list for second-hand clothes evaluation in RSC tokens.
        clothTypeToEvaluationPrice[CLOTH_TYPE.OTHER] = 2;
        clothTypeToEvaluationPrice[CLOTH_TYPE.TSHIRT] = 4;
        clothTypeToEvaluationPrice[CLOTH_TYPE.PANT] = 7;
        clothTypeToEvaluationPrice[CLOTH_TYPE.JACKET] = 15;
        clothTypeToEvaluationPrice[CLOTH_TYPE.DRESS] = 8;
        clothTypeToEvaluationPrice[CLOTH_TYPE.SHIRT] = 10;
    }
    
    /**
     * @notice Send second-hand clothes Box from a Customer account.
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
    onlyCustomer isValidBoxId(_boxId) areTypesAndQuantitiesArrayInvalid(_clothesTypes, _quantities) {        
        Box memory secondHandClothesBox = Box(
            _boxId, 
            block.timestamp, /// @dev Using "block.timestamp" here is safe because it is not involved in critical time constraints operations.
            _clothesTypes.length,
            0,
            _description, 
            msg.sender
        );
        
        // Create the SecondHandClothes array for the box clothes.
        for (uint i = 0; i < _clothesTypes.length; i++) {
            require(_quantities[i] > 0, "ZERO-QUANTITY");
            
            boxToSecondHandClothes[_boxId].push(
                SecondHandClothes(CLOTH_TYPE(_clothesTypes[i]), _quantities[i])
            );
        }
        
        // Storage update.
        idToBox[_boxId] = secondHandClothesBox;
        customerToBoxesIds[msg.sender].push(_boxId);
        
        // Event emit.
        emit SecondHandBoxSent(_boxId, _description, _clothesTypes, _quantities);
    }

    /**
     * @notice Evaluate a box of second-hand clothes and remunerate the sender with RSC tokens.
     * @dev RSC tokens' allowance from Dealer to ReclothesShop must satisfy the evaluation made with the pricing list plus the extra amount.
     * @param _boxId The unique numeric id used for identifying the box.
     * @param _extraAmountRSC An additional remuneration in RSC tokens for the box sender.
     */
    function evaluateBox(uint _boxId, uint _extraAmountRSC) 
    external 
    isBox(_boxId)
    onlyReclothesDealer {
        require(idToBox[_boxId].evaluationInToken == 0, "ALREADY-EVALUATED");

        // Estimation of the amount of RSC tokens to be transferred from the Dealer to the sender of the box.
        uint rscAmount = _extraAmountRSC;
        SecondHandClothes[] memory secondHandClothes = boxToSecondHandClothes[_boxId];
        
        for (uint i = 0; i < secondHandClothes.length; i++) {
            rscAmount += clothTypeToEvaluationPrice[secondHandClothes[i].clothType] * secondHandClothes[i].quantity;
        }        

        // Dealer inventory update.
        for (uint i = 0; i < secondHandClothes.length; i++) {
            inventory[CLOTH_TYPE(secondHandClothes[i].clothType)] += secondHandClothes[i].quantity;

            emit SecondHandClothesStored(secondHandClothes[i].clothType, secondHandClothes[i].quantity);
        }
        
        // Storage update.
        idToBox[_boxId].evaluationInToken = rscAmount;

        // Event emit.
        emit SecondHandBoxEvaluated(_boxId, rscAmount);
        
        // Token transfer from Dealer to box sender (Customer).
        resellingCreditInstance.transferFrom(reclothesDealer, idToBox[_boxId].sender, rscAmount);
    }
    
    /**
     * @notice Sell a second-hand cloth in the shop.
     * @dev Decrease by one the quantity of the chosen cloth type from the Dealer inventory.
     * @param _clothId The unique numeric id used for identifying the SaleableCloth.
     * @param _rscPrice The price of the SaleableCloth expressed in RSC tokens.
     * @param _clothType The type of cloth to sell.
     * @param _clothSize The size of cloth to sell.
     * @param _description A short description of the cloth.
     * @param _extClothDataHash A hash of external information related to the dress to sell (e.g., link to the cloth photo).
     */
    function sellSecondHandCloth(
        uint _clothId, 
        uint _rscPrice, 
        CLOTH_TYPE _clothType, 
        CLOTH_SIZE _clothSize,
        string calldata _description,
        bytes calldata _extClothDataHash
    ) external {
        require(inventory[_clothType] > 0, "INVENTORY-ZERO-QUANTITY");

        _sellCloth(
            _clothId, 
            _rscPrice, 
            _clothType, 
            _clothSize, 
            CLOTH_STATUS.SECOND_HAND, 
            _description, 
            _extClothDataHash
        );
        
        // Storage update.
        inventory[_clothType] -= 1;
    }

    /**
     * @notice Sell an upcycled cloth in the shop.
     * @dev Requires the confidential transaction hash relating to the confidential transaction sent by the Dealer for buying the cloth from a Recycler.
     * @param _clothId The unique numeric id used for identifying the SaleableCloth.
     * @param _rscPrice The price of the SaleableCloth expressed in RSC tokens.
     * @param _clothType The type of cloth to sell.
     * @param _clothSize The size of cloth to sell.
     * @param _description A short description of the cloth.
     * @param _extClothDataHash A hash of external information related to the dress to sell (e.g., link to the cloth photo).
     * @param _confidentialTxHash The hash of the confidential transaction sent by the Dealer for buying the cloth from a Recycler.
     */
    function sellUpcycledCloth(
        uint _clothId, 
        uint _rscPrice, 
        CLOTH_TYPE _clothType, 
        CLOTH_SIZE _clothSize,
        string calldata _description,
        bytes calldata _extClothDataHash,
        string calldata _confidentialTxHash
    ) external {
        _sellCloth(
            _clothId, 
            _rscPrice, 
            _clothType, 
            _clothSize, 
            CLOTH_STATUS.UPCYCLED, 
            _description, 
            _extClothDataHash
        );

        // Event emit.
        emit ConfidentialUpcycledClothOnSale(_clothId, _confidentialTxHash);
    }

    /**
     * @notice Buy a cloth from the shop.
     * @param _clothId The unique numeric id used for identifying the SaleableCloth available in the shop.
     */
    function buyCloth(uint _clothId) 
    external 
    onlyCustomer {
        require(idToSaleableCloth[_clothId].id == _clothId, "INVALID-CLOTH");
        require(idToSaleableCloth[_clothId].buyer == address(0x0), "ALREADY-SOLD");
        
        // Storage update.
        idToSaleableCloth[_clothId].buyer = msg.sender;
        customerToPurchasedClothesIds[msg.sender].push(_clothId);
        
        // Event emit.
        emit SaleableClothSold(_clothId, idToSaleableCloth[_clothId].price);
        
        // Token transfer from sender (Customer) to Dealer.
        resellingCreditInstance.transferFrom(msg.sender, reclothesDealer, idToSaleableCloth[_clothId].price);
    }
    
    /**
     * @notice Decrease the Dealer inventory clothes types quantities for the provided amounts.
     * @dev Requires the confidential transaction hash relating to the confidential transaction sent by the Dealer to send a box of second-hand clothes to a Recycler.
     * @param _clothesTypes The types of clothes to sell.
     * @param _quantities The quantities for each cloth type.
     * @param _confidentialTxHash The hash of the confidential transaction sent by the Dealer to send a box of second-hand clothes to a Recycler.
     */
    function decreaseStockForConfidentialBox(
        CLOTH_TYPE[] calldata _clothesTypes, 
        uint[] calldata _quantities, 
        string calldata _confidentialTxHash
    ) 
    external
    onlyReclothesDealer areTypesAndQuantitiesArrayInvalid(_clothesTypes, _quantities) {        
        // Dealer inventory update.
        for (uint i = 0; i < _clothesTypes.length; i++) {
            require(_quantities[i] > 0, "ZERO-QUANTITY");
            
            inventory[_clothesTypes[i]] -= _quantities[i];            
        }
        
        // Event emit.
        emit ConfidentialBoxSent(_clothesTypes, _quantities, _confidentialTxHash);
    }

    /**
     * @notice Transfer a RSC token amount from Dealer to Recycler.
     * @dev Requires the confidential transaction hash relating to the confidential transaction sent by the Dealer for buying the cloth from a Recycler.
     * @param _recycler The Recycler EOA.
     * @param _rscAmount The RSC token amount to transfer.
     * @param _confidentialTxHash The hash of the confidential transaction sent by the Dealer for buying the cloth from a Recycler.
     */
    function transferRSCForConfidentialTx(
        address _recycler, 
        uint _rscAmount, 
        string calldata _confidentialTxHash
    )
    external
    isRecycler(_recycler)
    onlyReclothesDealer {
        require(_rscAmount > 0, "ZERO-AMOUNT");

        // Event emit.
        emit ConfidentialTokenTransfer(msg.sender, _recycler, _rscAmount, _confidentialTxHash);

        // Token transfer from Dealer to Recycler.
        resellingCreditInstance.transferFrom(msg.sender, _recycler, _rscAmount);
    }
    
    /**
     * @notice Transfer a RSC token amount from Recycler to Dealer.
     * @dev Requires the confidential transaction hash relating to the confidential transaction sent by the Recycler for evaluating a second-hand clothes box sent by the Dealer.
     * @param _rgcAmount The RGC token amount to transfer.
     * @param _confidentialTxHash The hash of the confidential transaction sent by the Recycler for evaluating a second-hand clothes box sent by the Dealer.
     */
    function transferRGCForConfidentialTx(
        uint _rgcAmount, 
        string calldata _confidentialTxHash
    )
    external
    onlyRecycler {
        require(_rgcAmount > 0, "ZERO-AMOUNT");
        
        // Event emit.
        emit ConfidentialTokenTransfer(msg.sender, reclothesDealer, _rgcAmount, _confidentialTxHash);
        
        // Token transfer from Recycler to Dealer.
        regenerationCreditInstance.transferFrom(msg.sender, reclothesDealer, _rgcAmount);
    }

    /**
     * @notice Sell a cloth in the shop.
     * @param _clothId The unique numeric id used for identifying the SaleableCloth.
     * @param _rscPrice The price of the SaleableCloth expressed in RSC tokens.
     * @param _clothType The type of cloth to sell.
     * @param _clothSize The size of cloth to sell.
     * @param _clothStatus The status of cloth to sell.
     * @param _description A short description of the cloth.
     * @param _extClothDataHash A hash of external information related to the dress to sell (e.g., link to the cloth photo).
     */
    function _sellCloth(
        uint _clothId, 
        uint _rscPrice, 
        CLOTH_TYPE _clothType, 
        CLOTH_SIZE _clothSize,
        CLOTH_STATUS _clothStatus,
        string calldata _description,
        bytes calldata _extClothDataHash
    ) 
    internal
    isValidClothId(_clothId)
    onlyReclothesDealer {
        require(_rscPrice > 0, "INVALID-PRICE");

        SaleableCloth memory saleableCloth = SaleableCloth(
            _clothId,
            _rscPrice,
            CLOTH_TYPE(_clothType), 
            _clothSize, 
            _clothStatus,
            _description, 
            address(0x0),
            block.timestamp, /// @dev Using "block.timestamp" here is safe because it is not involved in critical time constraints operations.
            _extClothDataHash
        );

        // Storage update.
        _saleableClothesIds.push(_clothId);
        idToSaleableCloth[_clothId] = saleableCloth;

        // Event emit.
        emit SaleableClothAdded(_clothId, _rscPrice, _clothType, _clothSize, CLOTH_STATUS.UPCYCLED, _description, _extClothDataHash);
    }
    
    /** 
      * @notice Return the unique identifiers of every SaleableCloth.
      * @return The list of unique identifiers.
      */
    function getAllSaleableClothesIds() external view returns(uint[] memory){
        return _saleableClothesIds;
    }
    
    /** 
      * @notice Return the unique identifiers of every Box sent by the provided Customer.
      * @return The list of unique identifiers.
      */
    function getAllCustomerBoxesIds(address _customer) external view returns(uint[] memory){
        return customerToBoxesIds[_customer];
    }
    
    /** 
      * @notice Return the unique identifiers of every SaleableCloth purchased by the provided Customer.
      * @return The list of unique identifiers.
      */
    function getAllPurchasedClothesIds(address _customer) external view returns(uint[] memory){
        return customerToPurchasedClothesIds[_customer];
    }
}
