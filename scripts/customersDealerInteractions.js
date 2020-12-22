require('dotenv').config()
require('web3')
const colors = require('colors')
const SharedUtils = require('../shared/utils')

// Get all mocked boxes.
const mockedPublicBoxes = require('../mocks/publicBoxes.json')
// Get all mocked second-hand clothes.
const mockedSecondHandClothes = require('../mocks/secondHandClothes.json')

async function main () {
  // Initialize test utilities class.
  await SharedUtils.init(web3)

  // Get the default transaction parameters.
  this.transactionParameters = SharedUtils.getTransactionParameters()
  // Get the besu accounts.
  this.accounts = SharedUtils.getBesuAccounts()

  // Retrieve SC istances.
  console.log(`\n${colors.yellow('Gathering Smart Contract Istances')}`)
  this.resellingCreditInstance = SharedUtils.getResellingCreditSCObject().getInstance(process.env.RESELLING_ADDRESS)
  this.regenerationCreditInstance = SharedUtils.getRegenerationCreditSCObject().getInstance(process.env.REGENERATION_ADDRESS)
  this.reclothesShopInstance = SharedUtils.getReclothesShopSCObject().getInstance(process.env.RECLOTHES_SHOP_ADDRESS)
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.yellow('Smart Contract Method Interactions')}`)

  // Prepare mocked data.
  // Boxes.
  const firstBox = mockedPublicBoxes[0]
  const secondBox = mockedPublicBoxes[1]
  const thirdBox = mockedPublicBoxes[2]
  // Second-hand Clothes.
  const firstSecondHandCloth = mockedSecondHandClothes[0]

  console.log(`\n${colors.white('Send a box for evaluation (Customer1)')}`)
  await this.reclothesShopInstance.methods.sendBoxForEvaluation(
    firstBox.id,
    firstBox.description,
    firstBox.clothesTypes,
    firstBox.quantities,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer1,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.blue('Box Evaluation for Customer 1')}`)
  console.log(`\n${colors.white('Increase ReclothesShop SC allowance from Reclothes Dealer')}`)
  await this.resellingCreditInstance.methods.increaseAllowance(
    this.reclothesShopInstance._address,
    90,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })

  console.log(`\n${colors.white('Evaluate the box')}`)
  await this.reclothesShopInstance.methods.evaluateBox(
    firstBox.id,
    50,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Sell Second-Hand Cloth')}`)
  await this.reclothesShopInstance.methods.sellSecondHandCloth(
    firstSecondHandCloth.id,
    firstSecondHandCloth.price,
    firstSecondHandCloth.clothType,
    firstSecondHandCloth.size,
    firstSecondHandCloth.description,
    firstSecondHandCloth._extClothDataHash,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Send a box for evaluation (Customer2)')}`)
  await this.reclothesShopInstance.methods.sendBoxForEvaluation(
    secondBox.id,
    secondBox.description,
    secondBox.clothesTypes,
    secondBox.quantities,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer2,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.blue('Box Evaluation for Customer 2')}`)
  console.log(`\n${colors.white('Increase ReclothesShop SC allowance from Reclothes Dealer')}`)
  await this.resellingCreditInstance.methods.increaseAllowance(
    this.reclothesShopInstance._address,
    200,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })

  console.log(`\n${colors.white('Evaluate the box')}`)
  await this.reclothesShopInstance.methods.evaluateBox(
    secondBox.id,
    25,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Send a box for evaluation (Customer1)')}`)
  await this.reclothesShopInstance.methods.sendBoxForEvaluation(
    thirdBox.id,
    thirdBox.description,
    thirdBox.clothesTypes,
    thirdBox.quantities,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer1,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.blue('Buy Second-Hand Cloth from Customer 2')}`)
  console.log(`\n${colors.white('Increase ReclothesShop SC allowance from Customer 2')}`)
  await this.resellingCreditInstance.methods.increaseAllowance(
    this.reclothesShopInstance._address,
    75,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer2,
  })

  console.log(`\n${colors.white('Buy the Second-Hand Cloth (Customer 2)')}`)
  await this.reclothesShopInstance.methods.buyCloth(
    firstSecondHandCloth.id,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer2,
  })
  console.log(`\n${colors.green('Done!')}`)

  return true
}

// Required by `truffle exec`
module.exports = function (callback) {
  return new Promise((resolve, reject) => {
    main()
      .then((value) => resolve(value))
      .catch(err => {
        console.log('Error:', err)
        reject(err)
      })
  })
}
