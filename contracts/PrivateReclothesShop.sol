// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ReclothesShop.sol";

/// @title The Reclothes Shop core and private business logic.
/// @author LINKS Foundation
/// @notice This contract enables Recyclers and Reclothes Dealer to transact and cooperate on buy/sell upcycled clothes.
/// @notice This contract guarantee the confidential transactions between Recyclers and Reclothes Dealer.
contract PrivateReclothesShop {
    /** Events */
    event SecondHandBoxSent(uint boxId, string description, CLOTH_TYPE[] clothesTypes, uint[] quantities);
    event SecondHandBoxEvaluated(uint boxId, uint rgcAmount);
    event SaleableClothAdded(uint clothId, uint rscPrice, CLOTH_TYPE clothType, CLOTH_SIZE clothSize, CLOTH_STATUS clothStatus, string description, bytes extClothDataHash);
    event SaleableClothSold(uint clothId, uint rscPrice);

    /** Storage */
    
    ResellingCredit public resellingCreditInstance; // The instance of the ResellingCredit smart contract.
    RegenerationCredit public regenerationCreditInstance; // The instance of the RegenerationCredit smart contract.
    ReclothesShop public reclothesShopInstance; // The instance of the ReclothesShop smart contract.

    /// @dev Associate a cloth type to its evaluation price defined in RGC token amount.
    mapping(CLOTH_TYPE => uint) public confidentialClothTypeToEvaluationPrice;

    /// @dev Associate a unique id to a specific box.
    mapping(uint => Box) public idToBox;

    /// @dev Associate a unique box id to a list of second-hand clothes (i.e., contained in the box).
    mapping(uint => SecondHandClothes[]) public boxToSecondHandClothes;

    /// @dev Associate a unique saleable cloth id to its data.
    mapping(uint => SaleableCloth) public idToSaleableCloth;

    /** Modifiers */
    /// @dev Strict condition which evaluates true only if the sender is the public Reclothes Dealer.
    modifier onlyReclothesDealer {
        require(reclothesShopInstance.hasRole(reclothesShopInstance.DEFAULT_ADMIN_ROLE(), msg.sender), "NOT-DEALER");
        _;
    }

    /// @dev Strict condition which evaluates true only if the sender is a recycler.
    modifier onlyRecycler {
        require(reclothesShopInstance.hasRole(reclothesShopInstance.RECYCLER_ROLE(), msg.sender), "NOT-RECYCLER");
        _;
    }
    
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
    
    /// @notice Deploy a new Private Reclothes Shop smart contract for confidential interactions between Recycler and Reclothes Dealer.
    /// @param _resellingCreditAddress The address of the ResellingCredit smart contract.
    /// @param _regenerationCreditAddress The address of the RegenerationCredit smart contract.
    /// @param _reclothesShopAddress The address of the ReclothesShop smart contract.
    /// @param _confidentialPricingList A list of evaluation prices for old clothes types.
    constructor(
        address _resellingCreditAddress, 
        address _regenerationCreditAddress, 
        address _reclothesShopAddress,
        uint[] memory _confidentialPricingList
    ) {
        // Setup public SC instance reference.
        resellingCreditInstance = ResellingCredit(_resellingCreditAddress);
        regenerationCreditInstance = RegenerationCredit(_regenerationCreditAddress);
        reclothesShopInstance = ReclothesShop(_reclothesShopAddress);

        // Set the dynamic pricing list.
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.OTHER] = _confidentialPricingList[0];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.TSHIRT] = _confidentialPricingList[1];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.PANT] = _confidentialPricingList[2];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.JACKET] = _confidentialPricingList[3];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.DRESS] = _confidentialPricingList[4];
        confidentialClothTypeToEvaluationPrice[CLOTH_TYPE.SHIRT] = _confidentialPricingList[5];
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
    onlyReclothesDealer isValidBoxId(_boxId) {
        // To avoid inconsistency when creating the old clothing array (nb. 6 is the number of possible cloth types).
        require(_clothesTypes.length == _quantities.length && _clothesTypes.length <= 6, "INVALID-ARRAYS");
        
        // Create a Box object.
        Box memory secondHandClothesBox = Box(
            _boxId, 
            block.timestamp, // nb. Using "block.timestamp" here is safe because it's not involved in time constraints operations.
            _clothesTypes.length,
            0, 
            _description, 
            msg.sender
        );

        // Update storage.
        idToBox[_boxId] = secondHandClothesBox;

        // Event emit.
        emit SecondHandBoxSent(_boxId, _description, _clothesTypes, _quantities);

        // Create and bind the OldClothes[] to the newly created box.
        for (uint i = 0; i < _clothesTypes.length; i++) {
            require(_quantities[i] > 0, "ZERO-QUANTITY");

            // Check if the admin has a valid amount of given clothes types inside the inventory.
            require(reclothesShopInstance.inventory(_clothesTypes[i]) >= _quantities[i], "INVALID-INVENTORY-AMOUNT");

            // Push the second-hand clothes to the array.
            boxToSecondHandClothes[_boxId].push(
                SecondHandClothes(CLOTH_TYPE(_clothesTypes[i]), _quantities[i])
            );
        }
    }
    
    /// @notice Evaluate a box of second-hand clothes and remunerate with RGC tokens the box sender.
    /// @dev This method needs that the recycler gives an amount of RGC tokens allowance to the contract itself.
    /// @param _boxId The unique id which identifies the box.
    /// @param _extraAmountRGC An extra amount of RGC tokens ad additional reward for the Reclothes Dealer.
    function evaluateBox(uint _boxId, uint _extraAmountRGC) 
    external 
    isBox(_boxId)
    onlyRecycler {
        require(idToBox[_boxId].evaluationInToken == 0, "ALREADY-EVALUATED"); // The box must not be already evaluated.
        
        // Box clothes evaluation.
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

    /// @notice Sell a new upcycled cloth purchasable from the Reclothes Dealer.
    /// @dev This method create a new upcycled cloth from Recycler perspective and it can be purchased from Reclothes Dealer.
    /// @param _clothId The unique id which identifies the cloth.
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
        bytes calldata _extClothDataHash
    ) 
    external
    isValidClothId(_clothId)
    onlyRecycler {
        require(_rscPrice > 0, "INVALID-PRICE"); // Check for zero prices.

        // Create a new SaleableCloth.
        SaleableCloth memory saleableCloth = SaleableCloth(
            _clothId, 
            _rscPrice,
            CLOTH_TYPE(_clothType), 
            _clothSize, 
            CLOTH_STATUS.UPCYCLED, 
            _description, 
            address(0x0),
            block.timestamp,
            _extClothDataHash
        );

        // Storage update.
        idToSaleableCloth[_clothId] = saleableCloth;

        // Event emit.
        emit SaleableClothAdded(_clothId, _rscPrice, _clothType, _clothSize, CLOTH_STATUS.UPCYCLED, _description, _extClothDataHash);
        
        require(reclothesShopInstance.inventory(_clothType) > 0, "INVENTORY-ZERO-QUANTITY"); // Check if inside the inventory there's an available quantity of that type.
    }
    
    /// @notice Buy an saleable cloth using RSC tokens.
    /// @param _clothId The unique id which identifies the available cloth.
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
