// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <=0.7.0;

import "./ResellingCredit.sol";
import "./RegenerationCredit.sol";
import "./ReclothesShopRoleManager.sol";
import "./ReclothesShopDataTypes.sol";

/// @title The Reclothes Shop core and public business logic.
/// @author LINKS Foundation
/// @notice This contract enables Customers and Reclothes Dealer to transact and cooperate on buy/sell second-hand clothes.
/// @notice This contract guarantee data consistency reflecting the public output of the confidential transactions between Recyclers and Reclothes Dealer.
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
    
    ResellingCredit public resellingCreditInstance; // The instance of the ResellingCredit smart contract.
    RegenerationCredit public regenerationCreditInstance; // The instance of the RegenerationCredit smart contract.
    address public reclothesDealer; // The EOA address of the Reclothes Dealer.
    
    /// @dev Associate a cloth type to its evaluation price defined in RSC token amount.
    mapping(CLOTH_TYPE => uint) public clothTypeToEvaluationPrice;
    
    /// @dev Associate a unique id to a specific box.
    mapping(uint => Box) public idToBox;

    /// @dev Associate a unique box id to a list of second-hand clothes (i.e., contained in the box).
    mapping(uint => SecondHandClothes[]) public boxToSecondHandClothes;

    /// @dev Associate a unique saleable cloth id to its data.
    mapping(uint => SaleableCloth) public idToSaleableCloth;

    /// @dev Associate a unique cloth type to the related quantity inside the dealer inventory (i.e., aggregated second-hand clothes quantities).
    mapping(CLOTH_TYPE => uint) public inventory;
    
    /// @dev Associate a unique EOA of a Customer to the list of his/her Box ids.
    mapping(address => uint[]) public customerToBoxesIds;

    /// @dev Associate a unique EOA of a Customer to the list of his/her purchased SaleableCloth ids.
    mapping(address => uint[]) public customerToPurchasedClothesIds;

    /// @dev List of all SaleableCloth ids.
    uint[] private _saleableClothesIds;

    /** Modifiers */
    
    /// @dev Strict condition which evaluates true only if the given id is greater than zero and if is not associated to a previously created box.
    modifier isValidBoxId(uint _id) {
        require(_id > 0, "ZERO-ID");
        require(idToBox[_id].id == 0, "ALREADY-USED-ID");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given id is greater than zero and if is not associated to a previously available cloth.
    modifier isValidClothId(uint _id) {
        require(_id > 0, "ZERO-ID");
        require(idToSaleableCloth[_id].id == 0, "ALREADY-SALEABLE-CLOTH");
        _;
    }
    
    /// @dev Strict condition which evaluates true only if the given id is associated to a previously created box.
    modifier isBox(uint _boxId) {
        require(idToBox[_boxId].id == _boxId, "NOT-BOX");
        _;
    }

    /** Methods */
    
    /// @notice Deploy a new Reclothes Shop associating it to the tokens contracts.
    /// @param _resellingCreditAddress The address of the ResellingCredit smart contract.
    /// @param _regenerationCreditAddress The address of the RegenerationCredit smart contract.
    constructor(
        address _resellingCreditAddress, 
        address _regenerationCreditAddress
    ) public {
        // Setup the role for the Reclothes Dealer.
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        reclothesDealer = msg.sender;
        
        // Setup ResellingCredit Token smart contract instance.
        resellingCreditInstance = ResellingCredit(_resellingCreditAddress);

        // Setup RegenerationCredit Token smart contract instance.
        regenerationCreditInstance = RegenerationCredit(_regenerationCreditAddress);
        
        // Price list for second-hand clothes evaluation in RSC tokens.
        clothTypeToEvaluationPrice[CLOTH_TYPE.OTHER] = 2;
        clothTypeToEvaluationPrice[CLOTH_TYPE.TSHIRT] = 4;
        clothTypeToEvaluationPrice[CLOTH_TYPE.PANT] = 7;
        clothTypeToEvaluationPrice[CLOTH_TYPE.JACKET] = 15;
        clothTypeToEvaluationPrice[CLOTH_TYPE.DRESS] = 8;
        clothTypeToEvaluationPrice[CLOTH_TYPE.SHIRT] = 10;
    }

    /// @notice Send a box of second-hand clothes from customer to dealer.
    /// @param _boxId The unique id which identifies the box.
    /// @param _description A short description of the box.
    /// @param _clothesTypes A list indicating the types of clothes inside the box.
    /// @param _quantities A list indicating the quantities of clothes for each type inside the box.
    function sendBoxForEvaluation(
        uint _boxId, 
        string calldata _description,
        CLOTH_TYPE[] calldata _clothesTypes, 
        uint[] calldata _quantities
    )
    external 
    onlyCustomer isValidBoxId(_boxId) {
        // To avoid inconsistency when creating the clothes array (nb. 6 is the number of possible clothes types).
        require(_clothesTypes.length == _quantities.length && _clothesTypes.length <= 6, "INVALID-ARRAYS");
        
        // Create a new Box object.
        Box memory secondHandClothesBox = Box(
            _boxId, 
            now, // nb. Using "now" here is safe because it's not involved in time constraints operations.
            _clothesTypes.length,
            0,
            _description, 
            msg.sender
        );
        
        // Create and bind the SecondHandClothes array to the newly created box.
        for (uint i = 0; i < _clothesTypes.length; i++) {
            require(_quantities[i] > 0, "ZERO-QUANTITY");
            
            // Push the SecondHandClothes.
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

    /// @notice Evaluate a box of second-hand clothes and remunerate with RSC tokens the box sender.
    /// @dev This method needs that the dealer gives an amount of RSC tokens allowance to the contract itself.
    /// @param _boxId The unique id which identifies the box.
    /// @param _extraAmountRSC An extra amount of RSC tokens ad additional reward for the customer.
    function evaluateBox(uint _boxId, uint _extraAmountRSC) 
    external 
    isBox(_boxId)
    onlyReclothesDealer {
        require(idToBox[_boxId].evaluationInToken == 0, "ALREADY-EVALUATED"); // The box must not be already evaluated.
        
        // Compute the total amount of RSC tokens to send.
        uint rscAmount = _extraAmountRSC;
        SecondHandClothes[] memory secondHandClothes = boxToSecondHandClothes[_boxId];
        
        for (uint i = 0; i < secondHandClothes.length; i++) {
            rscAmount += clothTypeToEvaluationPrice[secondHandClothes[i].clothType] * secondHandClothes[i].quantity;
        }        

        // Sum second-hand clothes quantities to the dealer inventory.
        for (uint i = 0; i < secondHandClothes.length; i++) {
            inventory[CLOTH_TYPE(secondHandClothes[i].clothType)] += secondHandClothes[i].quantity;

            emit SecondHandClothesStored(secondHandClothes[i].clothType, secondHandClothes[i].quantity);
        }
        
        // Storage update.
        idToBox[_boxId].evaluationInToken = rscAmount;

        // Event emit.
        emit SecondHandBoxEvaluated(_boxId, rscAmount);
        
        // Token transfer from admin to customer.
        resellingCreditInstance.transferFrom(reclothesDealer, idToBox[_boxId].sender, rscAmount);
    }
    
    /// @notice Put on sale a second-hand cloth.
    /// @dev This method removes a cloth from the dealer's inventory and creates a new SaleableCloth for the customers.
    /// @param _clothId The unique id which identifies the saleable cloth.
    /// @param _rscPrice The price expressed as an amount of RSC.
    /// @param _clothType The type of the cloth to put on sale.
    /// @param _clothSize The size of the cloth to put on sale.
    /// @param _description A short description of the cloth.
    /// @param _extClothDataHash A hash of the external data related to the cloth.
    function sellSecondHandCloth(
        uint _clothId, 
        uint _rscPrice, 
        CLOTH_TYPE _clothType, 
        CLOTH_SIZE _clothSize,
        string calldata _description,
        bytes calldata _extClothDataHash
    ) external {
        require(inventory[_clothType] > 0, "INVENTORY-ZERO-QUANTITY"); // Check if inside the inventory there's an available quantity of that type.
        
        // Create a new second-hand cloth to sell.
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
    
    /// @notice Put on sale a new upcycled cloth.
    /// @dev This method requires the tx hash relative to the confidential transaction where the dealer bought the recycler cloth.
    /// @param _clothId The unique id which identifies the saleable cloth.
    /// @param _rscPrice The price expressed as an amount of RSC.
    /// @param _clothType The type of the cloth to put on sale.
    /// @param _clothSize The size of the cloth to put on sale.
    /// @param _description A short description of the cloth.
    /// @param _extClothDataHash A hash of the external data related to the cloth.
    function sellUpcycledCloth(
        uint _clothId, 
        uint _rscPrice, 
        CLOTH_TYPE _clothType, 
        CLOTH_SIZE _clothSize,
        string calldata _description,
        bytes calldata _extClothDataHash,
        string calldata _confidentialTxHash
    ) external {
        // Create a new upcycled cloth to sell.
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

    /// @notice Buy a saleable cloth using RSC tokens.
    /// @param _clothId The unique id which identifies the saleable cloth.
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
        
        // Token transfer from customer to dealer.
        resellingCreditInstance.transferFrom(msg.sender, reclothesDealer, idToSaleableCloth[_clothId].price);
    }
    
    /// @notice Decrease the inventory stock quantity for the clothes types involved in a confidential box.
    /// @param _clothesTypes The type of the cloth to put on sale.
    /// @param _quantities The list of clothes types quantities.
    /// @param _confidentialTxHash The public tx hash generated for the confidential tx.
    function decreaseStockForConfidentialBox(
        CLOTH_TYPE[] calldata _clothesTypes, 
        uint[] calldata _quantities, 
        string calldata _confidentialTxHash
    ) 
    external
    onlyReclothesDealer {
        // To avoid inconsistency when creating the old clothing array (nb. 6 is the number of possible cloth types).
        require(_clothesTypes.length == _quantities.length && _clothesTypes.length <= 6, "INVALID-ARRAYS");
        
        // Decrease inventory stock quantity.
        for (uint i = 0; i < _clothesTypes.length; i++) {
            require(_quantities[i] > 0, "ZERO-QUANTITY");
            
            inventory[_clothesTypes[i]] -= _quantities[i];            
        }
        
        // Event emit.
        emit ConfidentialBoxSent(_clothesTypes, _quantities, _confidentialTxHash);
    }
    
    /// @notice Transfer a RSC token amount from dealer to recycler for an upcycled cloth purchase involved in a confidential tx.
    /// @param _recycler The EOA of the recycler.
    /// @param _rscAmount The RSC tokens amount to transfer.
    /// @param _confidentialTxHash The public tx hash generated for the confidential tx.
    function transferRSCForConfidentialTx(address _recycler, uint _rscAmount, string calldata _confidentialTxHash)
    external
    isRecycler(_recycler)
    onlyReclothesDealer {
        require(_rscAmount > 0, "ZERO-AMOUNT");

        // Event emit.
        emit ConfidentialTokenTransfer(msg.sender, _recycler, _rscAmount, _confidentialTxHash);

        // Token transfer from dealer to recycler.
        resellingCreditInstance.transferFrom(msg.sender, _recycler, _rscAmount);
    }
    
    /// @notice Transfer a RGC amount from recycler to dealer related to a confidential box evaluation tx.
    /// @param _rgcAmount The RGC tokens amount to transfer.
    /// @param _confidentialTxHash The public tx hash generated for the confidential tx.
    function transferRGCForConfidentialTx(uint _rgcAmount, string calldata _confidentialTxHash)
    external
    onlyRecycler {
        require(_rgcAmount > 0, "ZERO-AMOUNT");
        
        // Event emit.
        emit ConfidentialTokenTransfer(msg.sender, reclothesDealer, _rgcAmount, _confidentialTxHash);
        
        // Token transfer from recycler to dealer.
        regenerationCreditInstance.transferFrom(msg.sender, reclothesDealer, _rgcAmount);
    }

    /// @notice Put on sale a new cloth.
    /// @param _clothId The unique id which identifies the saleable cloth.
    /// @param _rscPrice The price expressed as an amount of RSC.
    /// @param _clothType The type of the cloth to put on sale.
    /// @param _clothSize The size of the cloth to put on sale.
    /// @param _clothStatus The status of the cloth to put on sale.
    /// @param _description A short description of the cloth.
    /// @param _extClothDataHash A hash of the external data related to the cloth.
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
        require(_rscPrice > 0, "INVALID-PRICE"); // Check for zero prices.

        // Create a new SaleableCloth.
        SaleableCloth memory saleableCloth = SaleableCloth(
            _clothId,
            _rscPrice,
            CLOTH_TYPE(_clothType), 
            _clothSize, 
            _clothStatus,
            _description, 
            address(0x0),
            now, // nb. Using "now" here is safe because it's not involved in time constraints operations.
            _extClothDataHash
        );

        // Storage update.
        _saleableClothesIds.push(_clothId);
        idToSaleableCloth[_clothId] = saleableCloth;

        // Event emit.
        emit SaleableClothAdded(_clothId, _rscPrice, _clothType, _clothSize, CLOTH_STATUS.UPCYCLED, _description, _extClothDataHash);
    }
    
    /** @notice Return every SaleableCloth id.
      * @return List of the every SaleableCloth id.
      */
    function getAllSaleableClothesIds() external view returns(uint[] memory){
        return _saleableClothesIds;
    }
    
    /** @notice Return every Box id sent from the customer.
      * @return List of the every Box id.
      */
    function getAllCustomerBoxesIds(address _customer) external view returns(uint[] memory){
        return customerToBoxesIds[_customer];
    }
    
    /** @notice Return every SaleableCloth id purchased by the customer.
      * @return List of the every purchased SaleableCloth id.
      */
    function getAllPurchasedClothesIds(address _customer) external view returns(uint[] memory){
        return customerToPurchasedClothesIds[_customer];
    }
}
