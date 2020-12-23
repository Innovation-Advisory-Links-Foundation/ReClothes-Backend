require('dotenv').config()
require('web3')
const colors = require('colors')
const SharedUtils = require('../shared/utils')
const mockedCustomerBoxes = require('../mocks/customerBoxes.json')
const mockedSecondHandClothes = require('../mocks/secondHandClothes.json')

async function main () {
  // Initialize utility class.
  await SharedUtils.init(web3)

  this.transactionParameters = SharedUtils.getTransactionParameters()
  this.accounts = SharedUtils.getBesuAccounts()

  console.log(`\n${colors.yellow('Gathering Smart Contract Istances')}`)
  this.resellingCreditInstance = SharedUtils.getResellingCreditSCObject().getInstance(process.env.RESELLING_ADDRESS)
  this.regenerationCreditInstance = SharedUtils.getRegenerationCreditSCObject().getInstance(process.env.REGENERATION_ADDRESS)
  this.reclothesShopInstance = SharedUtils.getReclothesShopSCObject().getInstance(process.env.RECLOTHES_SHOP_ADDRESS)
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.yellow('Smart Contract Method Interactions')}`)

  console.log(`\n${colors.white('Send a box for evaluation (Customer1)')}`)
  await this.reclothesShopInstance.methods.sendBoxForEvaluation(
    mockedCustomerBoxes[0].id,
    mockedCustomerBoxes[0].description,
    mockedCustomerBoxes[0].clothesTypes,
    mockedCustomerBoxes[0].quantities,
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
    mockedCustomerBoxes[0].id,
    50,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Sell Second-Hand Cloth')}`)
  await this.reclothesShopInstance.methods.sellSecondHandCloth(
    mockedSecondHandClothes[0].id,
    mockedSecondHandClothes[0].price,
    mockedSecondHandClothes[0].clothType,
    mockedSecondHandClothes[0].size,
    mockedSecondHandClothes[0].description,
    mockedSecondHandClothes[0]._extClothDataHash,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Send a box for evaluation (Customer2)')}`)
  await this.reclothesShopInstance.methods.sendBoxForEvaluation(
    mockedCustomerBoxes[1].id,
    mockedCustomerBoxes[1].description,
    mockedCustomerBoxes[1].clothesTypes,
    mockedCustomerBoxes[1].quantities,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer2,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.blue('Box Evaluation for Customer 2')}`)
  console.log(`\n${colors.white('Increase ReclothesShop SC allowance from Reclothes Dealer')}`)
  await this.resellingCreditInstance.methods.increaseAllowance(
    this.reclothesShopInstance._address,
    210,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })

  console.log(`\n${colors.white('Evaluate the box')}`)
  await this.reclothesShopInstance.methods.evaluateBox(
    mockedCustomerBoxes[1].id,
    25,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Send a box for evaluation (Customer1)')}`)
  await this.reclothesShopInstance.methods.sendBoxForEvaluation(
    mockedCustomerBoxes[2].id,
    mockedCustomerBoxes[2].description,
    mockedCustomerBoxes[2].clothesTypes,
    mockedCustomerBoxes[2].quantities,
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
    mockedSecondHandClothes[0].id,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.customer2,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Sell Second-Hand Cloth')}`)
  await this.reclothesShopInstance.methods.sellSecondHandCloth(
    mockedSecondHandClothes[1].id,
    mockedSecondHandClothes[1].price,
    mockedSecondHandClothes[1].clothType,
    mockedSecondHandClothes[1].size,
    mockedSecondHandClothes[1].description,
    mockedSecondHandClothes[1]._extClothDataHash,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Sell Second-Hand Cloth')}`)
  await this.reclothesShopInstance.methods.sellSecondHandCloth(
    mockedSecondHandClothes[2].id,
    mockedSecondHandClothes[2].price,
    mockedSecondHandClothes[2].clothType,
    mockedSecondHandClothes[2].size,
    mockedSecondHandClothes[2].description,
    mockedSecondHandClothes[2]._extClothDataHash,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Sell Second-Hand Cloth')}`)
  await this.reclothesShopInstance.methods.sellSecondHandCloth(
    mockedSecondHandClothes[3].id,
    mockedSecondHandClothes[3].price,
    mockedSecondHandClothes[3].clothType,
    mockedSecondHandClothes[3].size,
    mockedSecondHandClothes[3].description,
    mockedSecondHandClothes[3]._extClothDataHash,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
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
