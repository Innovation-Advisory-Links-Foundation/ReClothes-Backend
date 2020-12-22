require('dotenv').config()
require('web3')
// Import Open Zeppelin test utils.
const { expectRevert } = require('@openzeppelin/test-helpers')
// Import our utilities.
const SharedUtils = require('../shared/utils')
// Import Chai expect interface.
const { expect } = require('chai')

contract('Private Reclothes Shop', () => {
  const confidentialEvaluationPricingList = {
    0: 3, // OTHER.
    1: 5, // TSHIRT.
    2: 8, // PANTS.
    3: 16, // JACKET.
    4: 9, // DRESS.
    5: 11, // SHIRT.
  }
  const confidentialPricingArray = []
  confidentialPricingArray.push(confidentialEvaluationPricingList[0])
  confidentialPricingArray.push(confidentialEvaluationPricingList[1])
  confidentialPricingArray.push(confidentialEvaluationPricingList[2])
  confidentialPricingArray.push(confidentialEvaluationPricingList[3])
  confidentialPricingArray.push(confidentialEvaluationPricingList[4])
  confidentialPricingArray.push(confidentialEvaluationPricingList[5])

  before(async function () {
    // Initialize utilities class.
    await SharedUtils.init(web3)

    // Get the default transaction parameters.
    this.transactionParameters = SharedUtils.getTransactionParameters()

    // Get the accounts.
    this.tokenManager = SharedUtils.getTestAccounts().tokenManager
    this.reclothesDealer = SharedUtils.getTestAccounts().reclothesDealer
    this.customer = SharedUtils.getTestAccounts().customer1
    this.recycler = SharedUtils.getTestAccounts().recycler1

    // Deploy and retrieve a new ResellingCredit smart contract instance.
    this.resellingCreditInstance = await SharedUtils.createNewResellingCreditInstance(process.env.INITIAL_SUPPLY, this.tokenManager)
    // Deploy and retrieve a new RegenerationCredit smart contract instance.
    this.regenerationCreditInstance = await SharedUtils.createNewRegenerationCreditInstance(process.env.INITIAL_SUPPLY, this.tokenManager)
    // Deploy and retrieve a new ReclothesShop smart contract instance.
    this.reclothesShopInstance = await SharedUtils.createNewReclothesShopInstance(
      this.resellingCreditInstance._address,
      this.regenerationCreditInstance._address,
      this.reclothesDealer,
    )
    // Deploy and retrieve a new PrivateReclothesShop smart contract instance.
    this.privateReclothesShopInstance = await SharedUtils.createNewPrivateReclothesShopInstance(
      this.resellingCreditInstance._address,
      this.regenerationCreditInstance._address,
      this.reclothesShopInstance._address,
      confidentialPricingArray,
      this.reclothesDealer,
    )

    // Mock interactions for initializing the public ReclothesShop smart contract

    // Transfer RSC Tokens from Token Manager to Reclothes Dealer.
    await this.resellingCreditInstance.methods.transfer(
      this.reclothesDealer,
      100000,
    ).send({
      ...this.transactionParameters,
      from: this.tokenManager,
      nonce: await web3.eth.getTransactionCount(this.tokenManager),
    })

    // Grant the customer role.
    await this.reclothesShopInstance.methods.registerAsCustomer().send({
      ...this.transactionParameters,
      from: this.customer,
      nonce: await web3.eth.getTransactionCount(this.customer),
    })

    // Grant the recycler role.
    await this.reclothesShopInstance.methods.grantRecyclerRole(
      this.recycler,
    ).send({
      ...this.transactionParameters,
      from: this.reclothesDealer,
      nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
    })

    // Transfer RGC Tokens from Token Manager to Recycler.
    await this.regenerationCreditInstance.methods.transfer(
      this.recycler,
      100000,
    ).send({
      ...this.transactionParameters,
      from: this.tokenManager,
      nonce: await web3.eth.getTransactionCount(this.tokenManager),
    })

    // Send second-hand box for evaluation.
    await this.reclothesShopInstance.methods.sendBoxForEvaluation(
      1,
      'A short second-hand box description',
      [0, 1, 2],
      [10, 5, 7],
    ).send({
      ...this.transactionParameters,
      from: this.customer,
      nonce: await web3.eth.getTransactionCount(this.customer),
    })

    // Set ReclothesShop allowance for RSC tokens from Reclothes Dealer.
    await this.resellingCreditInstance.methods.increaseAllowance(
      this.reclothesShopInstance._address,
      1000,
    ).send({
      ...this.transactionParameters,
      from: this.reclothesDealer,
      nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
    })

    // Second-hand box evaluation.
    await this.reclothesShopInstance.methods.evaluateBox(
      1,
      10,
    ).send({
      ...this.transactionParameters,
      from: this.reclothesDealer,
      nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
    })
  })

  describe('# Initialization', function () {
    it('[1] Should match the address of the deployed ResellingCredit smart contract', async function () {
      const expectedResellingCreditAddress = await this.privateReclothesShopInstance.methods.resellingCreditInstance().call({
        from: this.reclothesDealer,
      })

      expect(this.resellingCreditInstance._address).to.be.equal(expectedResellingCreditAddress)
    })

    it('[2] Should match the address of the deployed RegenerationCredit smart contract', async function () {
      const expectedRegenerationCreditAddress = await this.privateReclothesShopInstance.methods.regenerationCreditInstance().call({
        from: this.reclothesDealer,
      })

      expect(this.regenerationCreditInstance._address).to.be.equal(expectedRegenerationCreditAddress)
    })

    it('[3] Should match the address of the deployed ReclotheShop smart contract', async function () {
      const expectedReclothesShopAddress = await this.privateReclothesShopInstance.methods.reclothesShopInstance().call({
        from: this.reclothesDealer,
      })

      expect(this.reclothesShopInstance._address).to.be.equal(expectedReclothesShopAddress)
    })

    it('[4] Should match the amount of each confidential evaluation price for the possible clothes types', async function () {
      const expectedOtherPrice = await this.privateReclothesShopInstance.methods.confidentialClothTypeToEvaluationPrice(0).call({
        from: this.reclothesDealer,
      })

      const expectedTShirtPrice = await this.privateReclothesShopInstance.methods.confidentialClothTypeToEvaluationPrice(1).call({
        from: this.reclothesDealer,
      })

      const expectedPantPrice = await this.privateReclothesShopInstance.methods.confidentialClothTypeToEvaluationPrice(2).call({
        from: this.reclothesDealer,
      })

      const expectedJacketPrice = await this.privateReclothesShopInstance.methods.confidentialClothTypeToEvaluationPrice(3).call({
        from: this.reclothesDealer,
      })

      const expectedDressPrice = await this.privateReclothesShopInstance.methods.confidentialClothTypeToEvaluationPrice(4).call({
        from: this.reclothesDealer,
      })

      const expectedShirtPrice = await this.privateReclothesShopInstance.methods.confidentialClothTypeToEvaluationPrice(5).call({
        from: this.reclothesDealer,
      })

      expect(confidentialEvaluationPricingList[0]).to.be.equal(parseInt(expectedOtherPrice))
      expect(confidentialEvaluationPricingList[1]).to.be.equal(parseInt(expectedTShirtPrice))
      expect(confidentialEvaluationPricingList[2]).to.be.equal(parseInt(expectedPantPrice))
      expect(confidentialEvaluationPricingList[3]).to.be.equal(parseInt(expectedJacketPrice))
      expect(confidentialEvaluationPricingList[4]).to.be.equal(parseInt(expectedDressPrice))
      expect(confidentialEvaluationPricingList[5]).to.be.equal(parseInt(expectedShirtPrice))
    })
  })

  describe('# Send Box for Evaluation', function () {
    // Box data.
    const boxId = 38
    const description = 'A short description of the box'
    const clothesTypes = [0, 1]
    const quantities = [3, 2]

    it('[5] Shouldn\'t be possible to send a box if the sender is not the Reclothes Dealer', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        clothesTypes,
        quantities,
      ).send({
        ...this.transactionParameters,
        from: this.customer,
        nonce: await web3.eth.getTransactionCount(this.customer),
      })

      await expectRevert(expectedRevert, 'NOT-DEALER')
    })

    it('[6] Shouldn\'t be possible to send a box if the given id is equal to zero', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        0,
        description,
        clothesTypes,
        quantities,
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'ZERO-ID')
    })

    it('[7] Shouldn\'t be possible to send a box if the clothes types and quantities arrays have a different length', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        clothesTypes,
        [1],
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'INVALID-ARRAYS')
    })

    it('[8] Shouldn\'t be possible to send a box if the clothes types array has a length greater than the number of possible cloth types', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'INVALID-ARRAYS')
    })

    it('[9] Shouldn\'t be possible to send a box if the quantities array has at least a value equal to zero', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        clothesTypes,
        [0, 1],
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'ZERO-QUANTITY')
    })

    it('[10] Shouldn\'t be possible to send a box if the quantities array has at least a value greater than the public inventory quantity for the correspondent cloth type', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        clothesTypes,
        [1, 100],
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'INVALID-INVENTORY-AMOUNT')
    })

    it('[11] Should be possible for the Reclothes Dealer to send a box for evaluation to the Recycler', async function () {
      // Send a box for evaluation.
      const transactionReceipt = await this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        clothesTypes,
        quantities,
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      // Check the event data.
      const evBoxId = transactionReceipt.events.SecondHandBoxSent.returnValues.boxId
      const evDescription = transactionReceipt.events.SecondHandBoxSent.returnValues.description
      const evClothesTypes = transactionReceipt.events.SecondHandBoxSent.returnValues.clothesTypes
      const evQuantities = transactionReceipt.events.SecondHandBoxSent.returnValues.quantities

      // Check if the box has been added to the relative mapping.
      const expectedSecondHandBox = await this.privateReclothesShopInstance.methods.idToBox(boxId).call({
        from: this.reclothesDealer,
      })

      // Check the second-hand clothes.
      const expectedSecondHandCloth0 = await this.privateReclothesShopInstance.methods.boxToSecondHandClothes(boxId, 0).call({
        from: this.reclothesDealer,
      })

      const expectedSecondHandCloth1 = await this.privateReclothesShopInstance.methods.boxToSecondHandClothes(boxId, 1).call({
        from: this.reclothesDealer,
      })

      // Checks.
      expect(parseInt(evBoxId)).to.be.equal(boxId)
      expect(evDescription).to.be.equal(description)
      expect(evClothesTypes.length).to.be.equal(clothesTypes.length)
      expect(evQuantities.length).to.be.equal(quantities.length)
      expect(parseInt(expectedSecondHandBox.evaluationInToken)).to.be.equal(0)
      expect(expectedSecondHandBox.sender).to.be.equal(this.reclothesDealer)
      expect(parseInt(expectedSecondHandCloth0.clothType)).to.be.equal(clothesTypes[0])
      expect(parseInt(expectedSecondHandCloth0.quantity)).to.be.equal(quantities[0])
      expect(parseInt(expectedSecondHandCloth1.clothType)).to.be.equal(clothesTypes[1])
      expect(parseInt(expectedSecondHandCloth1.quantity)).to.be.equal(quantities[1])
    })

    it('[12] Shouldn\'t be possible to send a box if the given id is already in use for another box', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sendBoxForEvaluation(
        boxId,
        description,
        clothesTypes,
        quantities,
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'ALREADY-USED-ID')
    })
  })

  describe('# Evaluate Box', function () {
    // Box evaluation data.
    const boxId = 38
    const extraAmountRGC = 15

    it('[13] Shouldn\'t be possible to evaluate a box if the sender is not the Recycler', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.evaluateBox(
        boxId,
        extraAmountRGC,
      ).send({
        ...this.transactionParameters,
        from: this.customer,
        nonce: await web3.eth.getTransactionCount(this.customer),
      })

      await expectRevert(expectedRevert, 'NOT-RECYCLER')
    })

    it('[14] Shouldn\'t be possible to evaluate a box if the given id doesn\'t correspond to a valid box', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.evaluateBox(
        10,
        extraAmountRGC,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      await expectRevert(expectedRevert, 'NOT-BOX')
    })

    it('[15] Should be possible for the Recycler to evaluate a box', async function () {
      // Evaluate a box.
      const transactionReceipt = await this.privateReclothesShopInstance.methods.evaluateBox(
        boxId,
        extraAmountRGC,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      // Check the event data.
      const evBoxId = transactionReceipt.events.SecondHandBoxEvaluated.returnValues.boxId
      const evRGCAmount = transactionReceipt.events.SecondHandBoxEvaluated.returnValues.rgcAmount

      // Get the second-hand clothes from the box.
      const secondHandCloth0 = await this.privateReclothesShopInstance.methods.boxToSecondHandClothes(boxId, 0).call({
        from: this.reclothesDealer,
      })

      const secondHandCloth1 = await this.privateReclothesShopInstance.methods.boxToSecondHandClothes(boxId, 1).call({
        from: this.reclothesDealer,
      })

      // Calculate the expected RSC token amount.
      let expectedRGCAmount = extraAmountRGC
      expectedRGCAmount += confidentialEvaluationPricingList[secondHandCloth0.clothType] * secondHandCloth0.quantity
      expectedRGCAmount += confidentialEvaluationPricingList[secondHandCloth1.clothType] * secondHandCloth1.quantity

      // Get the evaluated box.
      const expectedEvaluatedBox = await this.privateReclothesShopInstance.methods.idToBox(boxId).call({
        from: this.recycler,
      })

      // Checks.
      expect(parseInt(evBoxId)).to.be.equal(boxId)
      expect(parseInt(evRGCAmount)).to.be.equal(expectedRGCAmount)
      expect(parseInt(expectedEvaluatedBox.evaluationInToken)).to.be.equal(parseInt(expectedRGCAmount))
    })

    it('[16] Shouldn\'t be possible to evaluate a box twice', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.evaluateBox(
        boxId,
        extraAmountRGC,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      await expectRevert(expectedRevert, 'ALREADY-EVALUATED')
    })
  })

  describe('# Sell Upcycled Cloth', function () {
    // Sell Upcycled Cloth data.
    const clothId = 111
    const rscPrice = 62
    const clothType = 1
    const clothSize = 2
    const description = 'A short upcycled cloth description'
    const extClothDataHash = '0x0e634965b1762b51b7c89d2f2d2b82ded1c67657721277fc3d73bfac5b4df74959'

    it('[17] Shouldn\'t be possible to sell an upcycled cloth if the sender is not the Recycler', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sellUpcycledCloth(
        clothId,
        rscPrice,
        clothType,
        clothSize,
        description,
        extClothDataHash,
      ).send({
        ...this.transactionParameters,
        from: this.customer,
        nonce: await web3.eth.getTransactionCount(this.customer),
      })

      await expectRevert(expectedRevert, 'NOT-RECYCLER')
    })

    it('[18] Shouldn\'t be possible to sell an upcycled cloth if the given id is equal to zero', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sellUpcycledCloth(
        0,
        rscPrice,
        clothType,
        clothSize,
        description,
        extClothDataHash,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      await expectRevert(expectedRevert, 'ZERO-ID')
    })

    it('[19] Shouldn\'t be possible to sell an upcycled cloth if the specified price in RSC tokens is equal to zero', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sellUpcycledCloth(
        clothId,
        0,
        clothType,
        clothSize,
        description,
        extClothDataHash,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      await expectRevert(expectedRevert, 'INVALID-PRICE')
    })

    it('[20] Shouldn\'t be possible to sell an upcycled cloth if the given cloth type has zero quantity in the ReclotheShop inventory', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sellUpcycledCloth(
        clothId,
        rscPrice,
        5,
        clothSize,
        description,
        extClothDataHash,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      await expectRevert(expectedRevert, 'INVENTORY-ZERO-QUANTITY')
    })

    it('[21] Should be possible to sell an upcycled cloth', async function () {
      // Sell an upcycled cloth.
      const transactionReceipt = await this.privateReclothesShopInstance.methods.sellUpcycledCloth(
        clothId,
        rscPrice,
        clothType,
        clothSize,
        description,
        extClothDataHash,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      // Check the event data.
      const evClothId = transactionReceipt.events.SaleableClothAdded.returnValues.clothId
      const evRSCPrice = transactionReceipt.events.SaleableClothAdded.returnValues.rscPrice
      const evClothType = transactionReceipt.events.SaleableClothAdded.returnValues.clothType
      const evClothSize = transactionReceipt.events.SaleableClothAdded.returnValues.clothSize
      const evDescription = transactionReceipt.events.SaleableClothAdded.returnValues.description
      const evExtClothDataHash = transactionReceipt.events.SaleableClothAdded.returnValues.extClothDataHash

      // Get the new salealble upcycled cloth.
      const expectedSaleableUpcycledCloth = await this.privateReclothesShopInstance.methods.idToSaleableCloth(clothId).call({
        from: this.reclothesDealer,
      })

      // Checks.
      expect(parseInt(evClothId)).to.be.equal(clothId)
      expect(parseInt(evRSCPrice)).to.be.equal(rscPrice)
      expect(parseInt(evClothType)).to.be.equal(clothType)
      expect(parseInt(evClothSize)).to.be.equal(clothSize)
      expect(evDescription).to.be.equal(description)
      expect(evExtClothDataHash).to.be.equal(extClothDataHash)
      expect(parseInt(expectedSaleableUpcycledCloth.id)).to.be.equal(clothId)
      expect(parseInt(expectedSaleableUpcycledCloth.buyer)).to.be.equal(0)
    })

    it('[22] Shouldn\'t be possible to sell an upcycled cloth if the given id is already in use', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.sellUpcycledCloth(
        clothId,
        rscPrice,
        clothType,
        clothSize,
        description,
        extClothDataHash,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })
      await expectRevert(expectedRevert, 'ALREADY-SALEABLE-CLOTH')
    })
  })

  describe('# Buy Cloth', function () {
    // Buy Cloth data.
    const clothId = 111

    it('[23] Shouldn\'t be possible to buy a cloth if the sender is not the Reclothes Dealer', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.buyCloth(
        clothId,
      ).send({
        ...this.transactionParameters,
        from: this.recycler,
        nonce: await web3.eth.getTransactionCount(this.recycler),
      })

      await expectRevert(expectedRevert, 'NOT-DEALER')
    })

    it('[24] Shouldn\'t be possible to buy a cloth if the given cloth id doesn\'t correspond to a valid cloth', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.buyCloth(
        11,
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'INVALID-CLOTH')
    })

    it('[25] Should be possible to buy a cloth', async function () {
      // Get the saleable cloth price.
      const saleableCloth = await this.privateReclothesShopInstance.methods.idToSaleableCloth(clothId).call({
        from: this.recycler,
      })
      const price = saleableCloth.price

      // Buy a cloth.
      const transactionReceipt = await this.privateReclothesShopInstance.methods.buyCloth(
        clothId,
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      // Check the event data.
      const evClothId = transactionReceipt.events.SaleableClothSold.returnValues.clothId
      const evRSCPrice = transactionReceipt.events.SaleableClothSold.returnValues.rscPrice

      // Get the saleable cloth data.
      const expectedSaleableCloth = await this.privateReclothesShopInstance.methods.idToSaleableCloth(clothId).call({
        from: this.customer,
      })

      // Checks.
      expect(parseInt(evClothId)).to.be.equal(clothId)
      expect(parseInt(evRSCPrice)).to.be.equal(parseInt(price))
      expect(expectedSaleableCloth.buyer).to.be.equal(this.reclothesDealer)
    })

    it('[26] Shouldn\'t be possible to buy a cloth twice', async function () {
      const expectedRevert = this.privateReclothesShopInstance.methods.buyCloth(
        clothId,
      ).send({
        ...this.transactionParameters,
        from: this.reclothesDealer,
        nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
      })

      await expectRevert(expectedRevert, 'ALREADY-SOLD')
    })
  })
})
