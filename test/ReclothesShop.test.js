require('dotenv').config()
require('web3')
// Import Open Zeppelin test utils.
const { expectRevert } = require('@openzeppelin/test-helpers')
// Import our utilities.
const SharedUtils = require('../shared/utils')
// Import Chai expect interface.
const { expect } = require('chai')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')

contract('Reclothes Shop', () => {
  const evaluationPricingList = {
    0: 2, // OTHER.
    1: 4, // TSHIRT.
    2: 7, // PANTS.
    3: 15, // JACKET.
    4: 8, // DRESS.
    5: 10, // SHIRT.
  }

  before(async function () {
    // Initialize utilities class.
    await SharedUtils.init(web3)

    // Get the default transaction parameters.
    this.transactionParameters = SharedUtils.getTransactionParameters()

    // Get the accounts.
    this.tokenManager = SharedUtils.getTestAccounts().tokenManager
    this.reclothesDealer = SharedUtils.getTestAccounts().reclothesDealer
    this.customer = SharedUtils.getTestAccounts().customer1
    this.notCustomer = SharedUtils.getTestAccounts().customer2
    this.recycler = SharedUtils.getTestAccounts().recycler1
    this.notRecycler = SharedUtils.getTestAccounts().recycler2

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
  })

  describe('# Initialization', function () {
    it('[1] Should match the Reclothes Dealer account address', async function () {
      const expectedReclothesDealerAccount = await this.reclothesShopInstance.methods.reclothesDealer().call({
        from: this.reclothesDealer,
      })

      expect(expectedReclothesDealerAccount).to.be.equal(this.reclothesDealer)
    })

    it('[2] Should return true when checking if the Reclothes Dealer has a DEFAULT_ADMIN_ROLE', async function () {
      // Get the DEFAULT_ADMIN_ROLE hash identifier.
      const DEFAULT_ADMIN_ROLE = await this.reclothesShopInstance.methods.DEFAULT_ADMIN_ROLE().call({
        from: this.reclothesDealer,
      })

      const expectedDefaultAdminRoleGranted = await this.reclothesShopInstance.methods.hasRole(DEFAULT_ADMIN_ROLE, this.reclothesDealer).call({
        from: this.reclothesDealer,
      })

      expect(true).to.be.equal(expectedDefaultAdminRoleGranted)
    })

    it('[3] Should match the address of the deployed ResellingCredit smart contract', async function () {
      const expectedResellingCreditAddress = await this.reclothesShopInstance.methods.resellingCreditInstance().call({
        from: this.reclothesDealer,
      })

      expect(this.resellingCreditInstance._address).to.be.equal(expectedResellingCreditAddress)
    })

    it('[4] Should match the address of the deployed RegenerationCredit smart contract', async function () {
      const expectedRegenerationCreditAddress = await this.reclothesShopInstance.methods.regenerationCreditInstance().call({
        from: this.reclothesDealer,
      })

      expect(this.regenerationCreditInstance._address).to.be.equal(expectedRegenerationCreditAddress)
    })

    it('[5] Should match the amount of each evaluation price for the possible clothes types', async function () {
      const expectedOtherPrice = await this.reclothesShopInstance.methods.clothTypeToEvaluationPrice(0).call({
        from: this.reclothesDealer,
      })

      const expectedTShirtPrice = await this.reclothesShopInstance.methods.clothTypeToEvaluationPrice(1).call({
        from: this.reclothesDealer,
      })

      const expectedPantPrice = await this.reclothesShopInstance.methods.clothTypeToEvaluationPrice(2).call({
        from: this.reclothesDealer,
      })

      const expectedJacketPrice = await this.reclothesShopInstance.methods.clothTypeToEvaluationPrice(3).call({
        from: this.reclothesDealer,
      })

      const expectedDressPrice = await this.reclothesShopInstance.methods.clothTypeToEvaluationPrice(4).call({
        from: this.reclothesDealer,
      })

      const expectedShirtPrice = await this.reclothesShopInstance.methods.clothTypeToEvaluationPrice(5).call({
        from: this.reclothesDealer,
      })

      expect(evaluationPricingList[0]).to.be.equal(parseInt(expectedOtherPrice))
      expect(evaluationPricingList[1]).to.be.equal(parseInt(expectedTShirtPrice))
      expect(evaluationPricingList[2]).to.be.equal(parseInt(expectedPantPrice))
      expect(evaluationPricingList[3]).to.be.equal(parseInt(expectedJacketPrice))
      expect(evaluationPricingList[4]).to.be.equal(parseInt(expectedDressPrice))
      expect(evaluationPricingList[5]).to.be.equal(parseInt(expectedShirtPrice))
    })

    it('[6] Should be possible for the Token Manager to transfer the initial 100000 RSC amount to the Reclothes Dealer', async function () {
      // Transfer the RSC tokens from Token Manager to Reclothes Dealer.
      const transactionReceipt = await this.resellingCreditInstance.methods.transfer(
        this.reclothesDealer,
        100000,
      ).send({
        ...this.transactionParameters,
        from: this.tokenManager,
        nonce: await web3.eth.getTransactionCount(this.tokenManager),
      })

      // Check the event data.
      const from = transactionReceipt.events.Transfer.returnValues.from
      const to = transactionReceipt.events.Transfer.returnValues.to
      const value = transactionReceipt.events.Transfer.returnValues.value

      // Get the Reclothes Dealer updated balance.
      const expectedReclotheDealerBalance = await this.resellingCreditInstance.methods.balanceOf(this.reclothesDealer).call({
        from: this.reclothesDealer,
      })

      // Checks.
      expect(from).to.be.equal(this.tokenManager)
      expect(to).to.be.equal(this.reclothesDealer)
      expect(parseInt(value)).to.be.equal(100000)
      expect(parseInt(value)).to.be.equal(parseInt(expectedReclotheDealerBalance))
    })
  })

  describe('# Role Management', function () {
    describe('# Customer', function () {
      it('[7] Shouldn\'t be possible to register as Customer if the sender is the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.registerAsCustomer().send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ALREADY-DEALER')
      })

      it('[8] Should be possible for a user without any other role to register as a Customer', async function () {
        // Grant CUSTOMER_ROLE to given account.
        const transactionReceipt = await this.reclothesShopInstance.methods.registerAsCustomer().send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        // Check the event data.
        const user = transactionReceipt.events.CustomerRegistered.returnValues.user

        // Check if the expected Customer has been registered.
        const expectedCustomerRegistered = await this.reclothesShopInstance.methods.customers(this.customer).call({
          from: this.customer,
        })

        // Checks.
        expect(user).to.be.equal(this.customer)
        expect(true).to.be.equal(expectedCustomerRegistered)
      })

      it('[9] Shouldn\'t be possible for a customer to register twice', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.registerAsCustomer().send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'ALREADY-CUSTOMER')
      })

      it('[10] Shouldn\'t be possible to renounce to the Customer role if the sender is not the Customer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.renounceToCustomerRole().send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'NOT-CUSTOMER')
      })

      it('[11] Should be possible for the Customer to renounce to the role', async function () {
        // Register as Customer.
        let transactionReceipt = await this.reclothesShopInstance.methods.registerAsCustomer()
          .send({
            ...this.transactionParameters,
            from: this.notCustomer,
            nonce: await web3.eth.getTransactionCount(this.notCustomer),
          })

        // Renounce to the Customer role.
        transactionReceipt = await this.reclothesShopInstance.methods.renounceToCustomerRole()
          .send({
            ...this.transactionParameters,
            from: this.notCustomer,
            nonce: await web3.eth.getTransactionCount(this.notCustomer),
          })

        // Check the event data.
        const customer = transactionReceipt.events.CustomerUnregistered.returnValues.customer

        // Check the customer role for user.
        const expectedNotCustomer = await this.reclothesShopInstance.methods.customers(this.notCustomer).call({
          from: this.notCustomer,
        })

        // Checks.
        expect(customer).to.be.equal(this.notCustomer)
        expect(false).to.be.equal(expectedNotCustomer)
      })
    })

    describe('# Recycler', function () {
      it('[12] Shouldn\'t be possible to grant the RECYCLER_ROLE if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.grantRecyclerRole(this.recycler).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[13] Shouldn\'t be possible to grant the RECYCLER_ROLE if the given account belongs to the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.grantRecyclerRole(this.reclothesDealer).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ALREADY-DEALER')
      })

      it('[14] Should be possible for the Reclothes Dealer to grant the RECYCLER_ROLE to a given account that is not associated to any other role', async function () {
        // Grant RECYCLER_ROLE to given account.
        const transactionReceipt = await this.reclothesShopInstance.methods.grantRecyclerRole(
          this.recycler,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const user = transactionReceipt.events.RecyclerRoleGranted.returnValues.user

        // Get the RECYCLER_ROLE identifier.
        const RECYCLER_ROLE = await this.reclothesShopInstance.methods.RECYCLER_ROLE().call({
          from: this.reclothesDealer,
        })

        // Check the expected RECYCLER_ROLE for the user account.
        const expectedRecyclerRoleGranted = await this.reclothesShopInstance.methods.hasRole(RECYCLER_ROLE, this.recycler).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(user).to.be.equal(this.recycler)
        expect(true).to.be.equal(expectedRecyclerRoleGranted)
      })

      it('[15] Shouldn\'t be possible for the Reclothes Dealer to grant the RECYCLER_ROLE twice', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.grantRecyclerRole(this.recycler).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ALREADY-RECYCLER')
      })

      it('[16] Shouldn\'t be possible to revoke the RECYCLER_ROLE if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.revokeRecyclerRole(this.recycler).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[17] Shouldn\'t be possible to revoke the RECYCLER_ROLE if the given account is not associated to the RECYCLER_ROLE', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.revokeRecyclerRole(this.notRecycler).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'NOT-RECYCLER')
      })

      it('[18] Should be possible for the Reclothes Dealer to revoke the RECYCLER_ROLE to a given account that is associated to it', async function () {
        // Grant the RECYCLER_ROLE to the given account.
        let transactionReceipt = await this.reclothesShopInstance.methods.grantRecyclerRole(
          this.notRecycler,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Get the RECYCLER_ROLE string identifier.
        const RECYCLER_ROLE = await this.reclothesShopInstance.methods.RECYCLER_ROLE().call({
          from: this.reclothesDealer,
        })

        // Revoke the RECYCLER_ROLE from the given account.
        transactionReceipt = await this.reclothesShopInstance.methods.revokeRecyclerRole(
          this.notRecycler,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const recycler = transactionReceipt.events.RecyclerRoleRevoked.returnValues.recycler

        // Check the recycler role for user.
        const expectedNotRecycler = await this.reclothesShopInstance.methods.hasRole(RECYCLER_ROLE, this.notRecycler).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(recycler).to.be.equal(this.notRecycler)
        expect(false).to.be.equal(expectedNotRecycler)
      })

      it('[19] Should be possible for the Token Manager to transfer the initial 10000 RGC amount to the recycler', async function () {
        // Transfer the RGC tokens from Token Manager to Recycler.
        const transactionReceipt = await this.regenerationCreditInstance.methods.transfer(
          this.recycler,
          10000,
        ).send({
          ...this.transactionParameters,
          from: this.tokenManager,
          nonce: await web3.eth.getTransactionCount(this.tokenManager),
        })

        // Check the event data.
        const from = transactionReceipt.events.Transfer.returnValues.from
        const to = transactionReceipt.events.Transfer.returnValues.to
        const value = transactionReceipt.events.Transfer.returnValues.value

        // Get the Recycler updated balance.
        const expectedRecyclerBalance = await this.regenerationCreditInstance.methods.balanceOf(this.recycler).call({
          from: this.tokenManager,
        })

        // Checks.
        expect(from).to.be.equal(this.tokenManager)
        expect(to).to.be.equal(this.recycler)
        expect(parseInt(value)).to.be.equal(10000)
        expect(parseInt(value)).to.be.equal(parseInt(expectedRecyclerBalance))
      })

      it('[20] Shouldn\'t be possible to register as Customer if the sender is associated to a RECYCLER_ROLE', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.registerAsCustomer().send({
          ...this.transactionParameters,
          from: this.recycler,
          nonce: await web3.eth.getTransactionCount(this.recycler),
        })

        await expectRevert(expectedRevert, 'ALREADY-RECYCLER')
      })

      it('[21] Shouldn\'t be possible to grant the RECYCLER_ROLE if the given account is associated to a CUSTOMER_ROLE', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.grantRecyclerRole(this.customer).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ALREADY-CUSTOMER')
      })
    })
  })

  describe('# Customer <-> Reclothes Dealer', function () {
    describe('# Send Box for Evaluation', function () {
      // Box data.
      const boxId = 38
      const description = 'A short description of the box'
      const clothesTypes = [0, 1, 4]
      const quantities = [2, 1, 3]

      it('[22] Shouldn\'t be possible to send a box if the sender is not a customer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sendBoxForEvaluation(
          boxId,
          description,
          clothesTypes,
          quantities,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'NOT-CUSTOMER')
      })

      it('[23] Shouldn\'t be possible to send a box if the given id is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sendBoxForEvaluation(
          0,
          description,
          clothesTypes,
          quantities,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'ZERO-ID')
      })

      it('[24] Shouldn\'t be possible to send a box if the clothes types and quantities arrays have a different length', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sendBoxForEvaluation(
          boxId,
          description,
          clothesTypes,
          [1],
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'INVALID-ARRAYS')
      })

      it('[25] Shouldn\'t be possible to send a box if the clothes types array has a length greater than the number of possible cloth types', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sendBoxForEvaluation(
          boxId,
          description,
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'INVALID-ARRAYS')
      })

      it('[26] Shouldn\'t be possible to send a box if the quantities array has at least a value equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sendBoxForEvaluation(
          boxId,
          description,
          clothesTypes,
          [0, 1, 2],
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'ZERO-QUANTITY')
      })

      it('[27] Should be possible for the Customer to send a box for evaluation to the Reclothes Dealer', async function () {
        // Send a box for evaluation.
        const transactionReceipt = await this.reclothesShopInstance.methods.sendBoxForEvaluation(
          boxId,
          description,
          clothesTypes,
          quantities,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        // Check the event data.
        const evBoxId = transactionReceipt.events.SecondHandBoxSent.returnValues.boxId
        const evDescription = transactionReceipt.events.SecondHandBoxSent.returnValues.description
        const evClothesTypes = transactionReceipt.events.SecondHandBoxSent.returnValues.clothesTypes
        const evQuantities = transactionReceipt.events.SecondHandBoxSent.returnValues.quantities

        // Check if the box has been added to the relative mapping.
        const expectedSecondHandBox = await this.reclothesShopInstance.methods.idToBox(boxId).call({
          from: this.reclothesDealer,
        })

        // Check the second-hand clothes.
        const expectedSecondHandCloth0 = await this.reclothesShopInstance.methods.boxToSecondHandClothes(boxId, 0).call({
          from: this.reclothesDealer,
        })

        const expectedSecondHandCloth1 = await this.reclothesShopInstance.methods.boxToSecondHandClothes(boxId, 1).call({
          from: this.reclothesDealer,
        })

        const expectedSecondHandCloth2 = await this.reclothesShopInstance.methods.boxToSecondHandClothes(boxId, 2).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(parseInt(evBoxId)).to.be.equal(boxId)
        expect(evDescription).to.be.equal(description)
        expect(evClothesTypes.length).to.be.equal(clothesTypes.length)
        expect(evQuantities.length).to.be.equal(quantities.length)
        expect(parseInt(expectedSecondHandBox.evaluationInToken)).to.be.equal(0)
        expect(expectedSecondHandBox.sender).to.be.equal(this.customer)
        expect(parseInt(expectedSecondHandCloth0.clothType)).to.be.equal(clothesTypes[0])
        expect(parseInt(expectedSecondHandCloth0.quantity)).to.be.equal(quantities[0])
        expect(parseInt(expectedSecondHandCloth1.clothType)).to.be.equal(clothesTypes[1])
        expect(parseInt(expectedSecondHandCloth1.quantity)).to.be.equal(quantities[1])
        expect(parseInt(expectedSecondHandCloth2.clothType)).to.be.equal(clothesTypes[2])
        expect(parseInt(expectedSecondHandCloth2.quantity)).to.be.equal(quantities[2])
      })

      it('[28] Shouldn\'t be possible to send a box if the given id is already in use for another box', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sendBoxForEvaluation(
          boxId,
          description,
          clothesTypes,
          quantities,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'ALREADY-USED-ID')
      })
    })

    describe('# Evaluate Box', function () {
      // Box evaluation data.
      const boxId = 38
      const extraAmountRSC = 15

      it('[29] Shouldn\'t be possible to evaluate a box if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.evaluateBox(
          boxId,
          extraAmountRSC,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[30] Shouldn\'t be possible to evaluate a box if the given id doesn\'t correspond to a valid box', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.evaluateBox(
          10,
          extraAmountRSC,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'NOT-BOX')
      })

      it('[31] Shouldn\'t be possible to evaluate a box if the RSC tokens amount exceeds the ReclothesShop allowance for spending ReclothesDealer RSC tokens', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.evaluateBox(
          boxId,
          extraAmountRSC,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ERC20: transfer amount exceeds allowance')
      })

      it('[32] Should be possible for the Reclothes Dealer to evaluate a box (including increasing the allowance for the ReclotheShop contract', async function () {
        // ReclotheShop contract RSC token allowance increasing from Reclothes Dealer tokens.
        let transactionReceipt = await this.resellingCreditInstance.methods.increaseAllowance(
          this.reclothesShopInstance._address,
          1000,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const owner = transactionReceipt.events.Approval.returnValues.owner
        const spender = transactionReceipt.events.Approval.returnValues.spender
        const value = transactionReceipt.events.Approval.returnValues.value

        // Read the ReclothesShop allowance for Reclothes Dealer Tokens.
        const expectedReclotheShopAllowance = await this.resellingCreditInstance.methods.allowance(
          this.reclothesDealer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.reclothesDealer,
        })

        // Get the current Reclothes Dealer balance (useful for next checks).
        const expectedReclothesDealerBalance = await this.resellingCreditInstance.methods.balanceOf(this.reclothesDealer).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(owner).to.be.equal(this.reclothesDealer)
        expect(spender).to.be.equal(this.reclothesShopInstance._address)
        expect(parseInt(value)).to.be.equal(1000)
        expect(parseInt(value)).to.be.equal(parseInt(expectedReclotheShopAllowance))

        // Evaluate a box.
        transactionReceipt = await this.reclothesShopInstance.methods.evaluateBox(
          boxId,
          extraAmountRSC,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const evBoxId = transactionReceipt.events.SecondHandBoxEvaluated.returnValues.boxId
        const evRSCAmount = transactionReceipt.events.SecondHandBoxEvaluated.returnValues.rscAmount

        // Get the second-hand clothes from events to calculate the price in RSC token.
        const clothTypes = []
        const quantities = []
        transactionReceipt.events.SecondHandClothesStored.forEach(event => {
          clothTypes.push(event.returnValues.clothType)
          quantities.push(event.returnValues.quantity)
        })

        // Calculate the expected RSC token amount.
        let expectedRSCAmount = 0
        clothTypes.forEach((clothType, i) => {
          expectedRSCAmount += evaluationPricingList[clothType] * quantities[i]
        })
        expectedRSCAmount += extraAmountRSC

        // Get the evaluated box.
        const expectedEvaluatedBox = await this.reclothesShopInstance.methods.idToBox(boxId).call({
          from: this.reclothesDealer,
        })

        // Get the updated balance for Reclothes Dealer.
        const expectedReclothesDealerUpdatedBalance = await this.resellingCreditInstance.methods.balanceOf(this.reclothesDealer).call({
          from: this.reclothesDealer,
        })

        // Check new allowance for spender (ReclothesShop contract).
        const expectedReclothesShopUpdatedAllowance = await this.resellingCreditInstance.methods.allowance(
          this.reclothesDealer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(parseInt(evBoxId)).to.be.equal(boxId)
        expect(parseInt(evRSCAmount)).to.be.equal(expectedRSCAmount)
        expect(parseInt(expectedEvaluatedBox.evaluationInToken)).to.be.equal(parseInt(expectedRSCAmount))
        expect(parseInt(expectedReclothesDealerUpdatedBalance)).to.be.equal(expectedReclothesDealerBalance - expectedRSCAmount)
        expect(parseInt(expectedReclothesShopUpdatedAllowance)).to.be.equal(expectedReclotheShopAllowance - expectedRSCAmount)
      })

      it('[33] Shouldn\'t be possible to evaluate a box twice', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.evaluateBox(
          boxId,
          extraAmountRSC,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ALREADY-EVALUATED')
      })
    })

    describe('# Sell Second-Hand Cloth', function () {
      // Sell Second-Hand Cloth data.
      const clothId = 11
      const rscPrice = 35
      const clothType = 1
      const clothSize = 1
      const description = 'A short second-hand cloth description'
      const extClothDataHash = '0x0e634965b1762b51b7c89d2f2d2b82ded1c67657721277fc3d73bfac5b4df74959'

      it('[34] Shouldn\'t be possible to sell a second-hand cloth if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellSecondHandCloth(
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

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[35] Shouldn\'t be possible to sell a second-hand cloth if the given id is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellSecondHandCloth(
          0,
          rscPrice,
          clothType,
          clothSize,
          description,
          extClothDataHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ZERO-ID')
      })

      it('[36] Shouldn\'t be possible to sell a second-hand cloth if there is a zero quantity in the inventory for that cloth type', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellSecondHandCloth(
          clothId,
          rscPrice,
          5,
          clothSize,
          description,
          extClothDataHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'INVENTORY-ZERO-QUANTITY')
      })

      it('[37] Shouldn\'t be possible to sell a second-hand cloth if the specified price in RSC tokens is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellSecondHandCloth(
          clothId,
          0,
          clothType,
          clothSize,
          description,
          extClothDataHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'INVALID-PRICE')
      })

      it('[38] Should be possible to sell a second-hand cloth', async function () {
        // Sell a second-hand cloth.
        const transactionReceipt = await this.reclothesShopInstance.methods.sellSecondHandCloth(
          clothId,
          rscPrice,
          clothType,
          clothSize,
          description,
          extClothDataHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const evClothId = transactionReceipt.events.SaleableClothAdded.returnValues.clothId
        const evRSCPrice = transactionReceipt.events.SaleableClothAdded.returnValues.rscPrice
        const evClothType = transactionReceipt.events.SaleableClothAdded.returnValues.clothType
        const evClothSize = transactionReceipt.events.SaleableClothAdded.returnValues.clothSize
        const evDescription = transactionReceipt.events.SaleableClothAdded.returnValues.description
        const evExtClothDataHash = transactionReceipt.events.SaleableClothAdded.returnValues.extClothDataHash

        // Get the new salealble second-hand cloth.
        const expectedSaleableSecondHandCloth = await this.reclothesShopInstance.methods.idToSaleableCloth(clothId).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(parseInt(evClothId)).to.be.equal(clothId)
        expect(parseInt(evRSCPrice)).to.be.equal(rscPrice)
        expect(parseInt(evClothType)).to.be.equal(clothType)
        expect(parseInt(evClothSize)).to.be.equal(clothSize)
        expect(evDescription).to.be.equal(description)
        expect(evExtClothDataHash).to.be.equal(extClothDataHash)
        expect(parseInt(expectedSaleableSecondHandCloth.id)).to.be.equal(clothId)
        expect(parseInt(expectedSaleableSecondHandCloth.buyer)).to.be.equal(0)
      })

      it('[39] Shouldn\'t be possible to sell a second-hand cloth if the given id is already in use', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellSecondHandCloth(
          clothId,
          rscPrice,
          4,
          clothSize,
          description,
          extClothDataHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ALREADY-SALEABLE-CLOTH')
      })
    })

    describe('# Buy Cloth', function () {
      // Buy Cloth data.
      const clothId = 11

      it('[40] Shouldn\'t be possible to buy a cloth if the sender is not a customer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.buyCloth(
          clothId,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'NOT-CUSTOMER')
      })

      it('[41] Shouldn\'t be possible to buy a cloth if the given cloth id doesn\'t correspond to a valid cloth', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.buyCloth(
          111,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'INVALID-CLOTH')
      })

      it('[42] Shouldn\'t be possible to buy a cloth if the RSC token amount exceeds the ReclothesShop contract allowance for spending customer RSC tokens', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.buyCloth(
          clothId,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'ERC20: transfer amount exceeds allowance')
      })

      it('[43] Should be possible to buy a cloth', async function () {
        // Get the saleable cloth price.
        const saleableCloth = await this.reclothesShopInstance.methods.idToSaleableCloth(clothId).call({
          from: this.customer,
        })
        const price = saleableCloth.price

        // Set RSC tokens allowance for ReclothesShop contract in order to spend customer RSC tokens.
        let transactionReceipt = await this.resellingCreditInstance.methods.increaseAllowance(
          this.reclothesShopInstance._address,
          parseInt(price),
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        // Check the event data.
        const owner = transactionReceipt.events.Approval.returnValues.owner
        const spender = transactionReceipt.events.Approval.returnValues.spender
        const value = transactionReceipt.events.Approval.returnValues.value

        // Get the ReclothesShop contract allowance.
        const expectedReclothesShopAllowance = await this.resellingCreditInstance.methods.allowance(
          this.customer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.customer,
        })

        // Get the current balance from customer (useful for next checks).
        const expectedCustomerBalance = await this.resellingCreditInstance.methods.balanceOf(this.customer).call({
          from: this.customer,
        })

        // Checks.
        expect(owner).to.be.equal(this.customer)
        expect(spender).to.be.equal(this.reclothesShopInstance._address)
        expect(parseInt(value)).to.be.equal(parseInt(price))
        expect(parseInt(value)).to.be.equal(parseInt(expectedReclothesShopAllowance))

        // Buy a cloth.
        transactionReceipt = await this.reclothesShopInstance.methods.buyCloth(
          clothId,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        // Check the event data.
        const evClothId = transactionReceipt.events.SaleableClothSold.returnValues.clothId
        const evRSCPrice = transactionReceipt.events.SaleableClothSold.returnValues.rscPrice

        // Get the saleable cloth data.
        const expectedSaleableCloth = await this.reclothesShopInstance.methods.idToSaleableCloth(clothId).call({
          from: this.customer,
        })

        // Get the customer updated balance.
        const expectedCustomerUpdatedBalance = await this.resellingCreditInstance.methods.balanceOf(this.customer).call({
          from: this.customer,
        })

        // Get the ReclothesShop contract updated allowance.
        const expectedReclothesShopUpdatedAllowance = await this.resellingCreditInstance.methods.allowance(
          this.customer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.customer,
        })

        // Checks.
        expect(parseInt(evClothId)).to.be.equal(clothId)
        expect(parseInt(evRSCPrice)).to.be.equal(parseInt(price))
        expect(expectedSaleableCloth.buyer).to.be.equal(this.customer)
        expect(parseInt(expectedCustomerUpdatedBalance)).to.be.equal(expectedCustomerBalance - parseInt(price))
        expect(parseInt(expectedReclothesShopUpdatedAllowance)).to.be.equal(expectedReclothesShopAllowance - parseInt(price))
      })

      it('[44] Shouldn\'t be possible to buy a cloth twice', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.buyCloth(
          clothId,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'ALREADY-SOLD')
      })
    })
  })

  describe('# Reclothes Dealer <-> Recycler', function () {
    describe('# Decrease Stock for Confidential Box', function () {
      // Decrease Stock for Confidential Box data.
      const clothesTypes = [0, 4]
      const quantities = [1, 1]
      const confidentialTxHash = '0x3ff1eff3dba9b6332421c08bb0a42b6d9b8650c75d29a7e77d5e07648a48f0da'

      it('[45] Shouldn\'t be possible to decrease a stock quantity if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
          clothesTypes,
          quantities,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[46] Shouldn\'t be possible to decrease a stock quantity if the clothes types and quantities arrays have a different length', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
          clothesTypes,
          [1],
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'INVALID-ARRAYS')
      })

      it('[47] Shouldn\'t be possible to decrease a stock quantity if the clothes types array has a length greater than the number of possible cloth types', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          quantities,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'INVALID-ARRAYS')
      })

      it('[48] Shouldn\'t be possible to decrease a stock quantity if the quantities array has at least a value equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
          clothesTypes,
          [0, 1],
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ZERO-QUANTITY')
      })

      it('[49] Should be possible to decrease a stock quantity', async function () {
        // Get the current stock quantities from the inventory for the given clothes types.
        const quantity0 = await this.reclothesShopInstance.methods.inventory(clothesTypes[0]).call({
          from: this.reclothesDealer,
        })

        const quantity1 = await this.reclothesShopInstance.methods.inventory(clothesTypes[1]).call({
          from: this.reclothesDealer,
        })

        // Decrease the stock quantity.
        const transactionReceipt = await this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
          clothesTypes,
          quantities,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const evClothesTypes = transactionReceipt.events.ConfidentialBoxSent.returnValues.clothesTypes
        const evQuantities = transactionReceipt.events.ConfidentialBoxSent.returnValues.quantities
        const evConfidentialTxHash = transactionReceipt.events.ConfidentialBoxSent.returnValues.confidentialTxHash

        // Get the updated stock quantities from the inventory for the given clothes types.
        const updatedQuantity0 = await this.reclothesShopInstance.methods.inventory(clothesTypes[0]).call({
          from: this.reclothesDealer,
        })

        const updatedQuantity1 = await this.reclothesShopInstance.methods.inventory(clothesTypes[1]).call({
          from: this.reclothesDealer,
        })
        // Checks.
        expect(parseInt(evClothesTypes[0])).to.be.equal(clothesTypes[0])
        expect(parseInt(evClothesTypes[1])).to.be.equal(clothesTypes[1])
        expect(parseInt(evQuantities[0])).to.be.equal(quantities[0])
        expect(parseInt(evQuantities[1])).to.be.equal(quantities[1])
        expect(evConfidentialTxHash).to.be.equal(confidentialTxHash)
        expect(parseInt(quantity0)).to.be.equal(quantities[0] + parseInt(updatedQuantity0))
        expect(parseInt(quantity1)).to.be.equal(quantities[1] + parseInt(updatedQuantity1))
      })
    })

    describe('# Transfer RGC for Confidential Transaction', function () {
      // Transfer RGC for Confidential Transaction data.
      const rgcAmount = 56
      const confidentialTxHash = '0x3ff1eff3dba9b6332421c08bb0a42b6d9b8650c75d29a7e77d5e07648a48f0da'

      it('[50] Shouldn\'t be possible to transfer RGC tokens for confidential transaction if the sender is not a recycler', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRGCForConfidentialTx(
          rgcAmount,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-RECYCLER')
      })

      it('[51] Shouldn\'t be possible to transfer RGC tokens for confidential transaction if the given RGC tokens amount is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRGCForConfidentialTx(
          0,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.recycler,
          nonce: await web3.eth.getTransactionCount(this.recycler),
        })

        await expectRevert(expectedRevert, 'ZERO-AMOUNT')
      })

      it('[52] Shouldn\'t be possible to transfer RGC tokens for confidential transaction if the given RGC amount exceeds the ReclothesShop allowance for spending the Recycler RGC tokens', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRGCForConfidentialTx(
          rgcAmount,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.recycler,
          nonce: await web3.eth.getTransactionCount(this.recycler),
        })

        await expectRevert(expectedRevert, 'ERC20: transfer amount exceeds allowance')
      })

      it('[53] Should be possible for the recycler to transfer RGC tokens for confidential transaction', async function () {
        // ReclotheShop contract RGC token allowance increasing from Recycler tokens.
        let transactionReceipt = await this.regenerationCreditInstance.methods.increaseAllowance(
          this.reclothesShopInstance._address,
          1000,
        ).send({
          ...this.transactionParameters,
          from: this.recycler,
          nonce: await web3.eth.getTransactionCount(this.recycler),
        })

        // Check the event data.
        const owner = transactionReceipt.events.Approval.returnValues.owner
        const spender = transactionReceipt.events.Approval.returnValues.spender
        const value = transactionReceipt.events.Approval.returnValues.value

        // Read the ReclothesShop allowance for Recycler Tokens.
        const expectedReclotheShopAllowance = await this.regenerationCreditInstance.methods.allowance(
          this.recycler,
          this.reclothesShopInstance._address,
        ).call({
          from: this.recycler,
        })

        // Get the current Recycler balance (useful for next checks).
        const expectedRecyclerBalance = await this.regenerationCreditInstance.methods.balanceOf(this.recycler).call({
          from: this.recycler,
        })

        // Checks.
        expect(owner).to.be.equal(this.recycler)
        expect(spender).to.be.equal(this.reclothesShopInstance._address)
        expect(parseInt(value)).to.be.equal(1000)
        expect(parseInt(value)).to.be.equal(parseInt(expectedReclotheShopAllowance))

        // Transfer RGC for Confidential Transaction.
        transactionReceipt = await this.reclothesShopInstance.methods.transferRGCForConfidentialTx(
          rgcAmount,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.recycler,
          nonce: await web3.eth.getTransactionCount(this.recycler),
        })

        // Check the event data.
        const evSender = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.sender
        const evReceiver = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.receiver
        const evAmount = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.amount
        const evConfidentialTxHash = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.confidentialTxHash

        // Get the updated balance for Recycler.
        const expectedRecyclerUpdatedBalance = await this.regenerationCreditInstance.methods.balanceOf(this.recycler).call({
          from: this.recycler,
        })

        // Check new allowance for spender (ReclothesShop contract).
        const expectedReclothesShopUpdatedAllowance = await this.regenerationCreditInstance.methods.allowance(
          this.recycler,
          this.reclothesShopInstance._address,
        ).call({
          from: this.recycler,
        })

        // Checks.
        expect(evSender).to.be.equal(this.recycler)
        expect(evReceiver).to.be.equal(this.reclothesDealer)
        expect(parseInt(evAmount)).to.be.equal(rgcAmount)
        expect(evConfidentialTxHash).to.be.equal(confidentialTxHash)
        expect(parseInt(expectedRecyclerUpdatedBalance)).to.be.equal(expectedRecyclerBalance - rgcAmount)
        expect(parseInt(expectedReclothesShopUpdatedAllowance)).to.be.equal(expectedReclotheShopAllowance - rgcAmount)
      })
    })

    describe('# Transfer RSC for Confidential Transaction', function () {
      // Transfer RSC for Confidential Transaction data.
      const rscAmount = 45
      const confidentialTxHash = '0x3ff1eff3dba9b6332421c08bb0a42b6d9b8650c75d29a7e77d5e07648a48f0da'

      it('[54] Shouldn\'t be possible to transfer RSC tokens for confidential transaction if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRSCForConfidentialTx(
          this.recycler,
          rscAmount,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[55] Shouldn\'t be possible to transfer RSC tokens for confidential transaction if the given account address is not associated to a RECYCLER_ROLE', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRSCForConfidentialTx(
          this.customer,
          rscAmount,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'NOT-RECYCLER')
      })

      it('[56] Shouldn\'t be possible to transfer RSC tokens for confidential transaction if the given RSC tokens amount is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRSCForConfidentialTx(
          this.recycler,
          0,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ZERO-AMOUNT')
      })

      it('[57] Shouldn\'t be possible to transfer RSC tokens for confidential transaction if the given RSC amount exceeds the ReclothesShop allowance for spending the Reclothes Dealer RSC tokens', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.transferRSCForConfidentialTx(
          this.recycler,
          5000,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ERC20: transfer amount exceeds allowance')
      })

      it('[58] Should be possible for the Reclothes Dealer to transfer RSC tokens for confidential transaction', async function () {
        // Read the ReclothesShop allowance for Reclothes Dealer Tokens.
        const expectedOldReclotheShopAllowance = await this.resellingCreditInstance.methods.allowance(
          this.reclothesDealer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.reclothesDealer,
        })

        // ReclotheShop contract RSC token allowance increasing from Reclothes Dealer tokens.
        let transactionReceipt = await this.resellingCreditInstance.methods.increaseAllowance(
          this.reclothesShopInstance._address,
          45,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const owner = transactionReceipt.events.Approval.returnValues.owner
        const spender = transactionReceipt.events.Approval.returnValues.spender
        const value = transactionReceipt.events.Approval.returnValues.value

        // Read the ReclothesShop allowance for Reclothes Dealer Tokens.
        const expectedReclotheShopAllowance = await this.resellingCreditInstance.methods.allowance(
          this.reclothesDealer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.reclothesDealer,
        })

        // Get the current Reclothes Dealer balance (useful for next checks).
        const expectedReclothesDealerBalance = await this.resellingCreditInstance.methods.balanceOf(this.reclothesDealer).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(owner).to.be.equal(this.reclothesDealer)
        expect(spender).to.be.equal(this.reclothesShopInstance._address)
        expect(parseInt(value)).to.be.equal(parseInt(expectedOldReclotheShopAllowance) + 45)
        expect(parseInt(value)).to.be.equal(parseInt(expectedReclotheShopAllowance))

        // Transfer RSC for Confidential Transaction.
        transactionReceipt = await this.reclothesShopInstance.methods.transferRSCForConfidentialTx(
          this.recycler,
          rscAmount,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const evSender = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.sender
        const evReceiver = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.receiver
        const evAmount = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.amount
        const evConfidentialTxHash = transactionReceipt.events.ConfidentialTokenTransfer.returnValues.confidentialTxHash

        // Get the updated balance for Reclothes Dealer.
        const expectedReclothesDealerUpdatedBalance = await this.resellingCreditInstance.methods.balanceOf(this.reclothesDealer).call({
          from: this.reclothesDealer,
        })

        // Check new allowance for spender (ReclothesShop contract).
        const expectedReclothesShopUpdatedAllowance = await this.resellingCreditInstance.methods.allowance(
          this.reclothesDealer,
          this.reclothesShopInstance._address,
        ).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(evSender).to.be.equal(this.reclothesDealer)
        expect(evReceiver).to.be.equal(this.recycler)
        expect(parseInt(evAmount)).to.be.equal(rscAmount)
        expect(evConfidentialTxHash).to.be.equal(confidentialTxHash)
        expect(parseInt(expectedReclothesDealerUpdatedBalance)).to.be.equal(parseInt(expectedReclothesDealerBalance) - rscAmount)
        expect(parseInt(expectedReclothesShopUpdatedAllowance)).to.be.equal(parseInt(expectedReclotheShopAllowance) - rscAmount)
      })
    })

    describe('# Sell Upcycled Cloth', function () {
      // Sell Upcycled Cloth data.
      const clothId = 111
      const rscPrice = 62
      const clothType = 4
      const clothSize = 3
      const description = 'A short upcycled cloth description'
      const extClothDataHash = '0x0e634965b1762b51b7c89d2f2d2b82ded1c67657721277fc3d73bfac5b4df74959'
      const confidentialTxHash = '0x3ff1eff3dba9b6332421c08bb0a42b6d9b8650c75d29a7e77d5e07648a48f0da'

      it('[59] Shouldn\'t be possible to sell an upcycled cloth if the sender is not the Reclothes Dealer', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellUpcycledCloth(
          clothId,
          rscPrice,
          clothType,
          clothSize,
          description,
          extClothDataHash,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.customer,
          nonce: await web3.eth.getTransactionCount(this.customer),
        })

        await expectRevert(expectedRevert, 'NOT-DEALER')
      })

      it('[60] Shouldn\'t be possible to sell an upcycled cloth if the given id is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellUpcycledCloth(
          0,
          rscPrice,
          clothType,
          clothSize,
          description,
          extClothDataHash,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'ZERO-ID')
      })

      it('[61] Shouldn\'t be possible to sell an upcycled cloth if the specified price in RSC tokens is equal to zero', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellUpcycledCloth(
          clothId,
          0,
          clothType,
          clothSize,
          description,
          extClothDataHash,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        await expectRevert(expectedRevert, 'INVALID-PRICE')
      })

      it('[62] Should be possible to sell an upcycled cloth', async function () {
        // Sell an upcycled cloth.
        const transactionReceipt = await this.reclothesShopInstance.methods.sellUpcycledCloth(
          clothId,
          rscPrice,
          clothType,
          clothSize,
          description,
          extClothDataHash,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })

        // Check the event data.
        const evClothId = transactionReceipt.events.SaleableClothAdded.returnValues.clothId
        const evRSCPrice = transactionReceipt.events.SaleableClothAdded.returnValues.rscPrice
        const evClothType = transactionReceipt.events.SaleableClothAdded.returnValues.clothType
        const evClothSize = transactionReceipt.events.SaleableClothAdded.returnValues.clothSize
        const evDescription = transactionReceipt.events.SaleableClothAdded.returnValues.description
        const evExtClothDataHash = transactionReceipt.events.SaleableClothAdded.returnValues.extClothDataHash
        const evConfidentialTxHash = transactionReceipt.events.ConfidentialUpcycledClothOnSale.returnValues.confidentialTxHash

        // Get the new salealble upcycled cloth.
        const expectedSaleableUpcycledCloth = await this.reclothesShopInstance.methods.idToSaleableCloth(clothId).call({
          from: this.reclothesDealer,
        })

        // Checks.
        expect(parseInt(evClothId)).to.be.equal(clothId)
        expect(parseInt(evRSCPrice)).to.be.equal(rscPrice)
        expect(parseInt(evClothType)).to.be.equal(clothType)
        expect(parseInt(evClothSize)).to.be.equal(clothSize)
        expect(evDescription).to.be.equal(description)
        expect(evExtClothDataHash).to.be.equal(extClothDataHash)
        expect(evConfidentialTxHash).to.be.equal(confidentialTxHash)
        expect(parseInt(expectedSaleableUpcycledCloth.id)).to.be.equal(clothId)
        expect(parseInt(expectedSaleableUpcycledCloth.buyer)).to.be.equal(0)
      })

      it('[63] Shouldn\'t be possible to sell an upcycled cloth if the given id is already in use', async function () {
        const expectedRevert = this.reclothesShopInstance.methods.sellUpcycledCloth(
          clothId,
          rscPrice,
          clothType,
          clothSize,
          description,
          extClothDataHash,
          confidentialTxHash,
        ).send({
          ...this.transactionParameters,
          from: this.reclothesDealer,
          nonce: await web3.eth.getTransactionCount(this.reclothesDealer),
        })
        await expectRevert(expectedRevert, 'ALREADY-SALEABLE-CLOTH')
      })
    })
  })
})
