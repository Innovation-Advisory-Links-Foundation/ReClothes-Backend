require('dotenv').config()
require('web3')
const colors = require('colors')
const SharedUtils = require('../shared/utils')

async function main () {
  // Initialize utility class.
  await SharedUtils.init(web3)

  this.transactionParameters = SharedUtils.getTransactionParameters()
  this.accounts = SharedUtils.getBesuAccounts()

  // Create a new ResellingCredit SC instance from TokenManager account.
  console.log(`\n${colors.white('Deploying ResellingCredit SC...')}`)
  this.resellingCreditInstance = await SharedUtils.createNewResellingCreditInstance(
    process.env.INITIAL_SUPPLY,
    this.accounts.tokenManager,
  )
  console.log(`\n${colors.green('ResellingCredit SC Address')} -> (${colors.magenta(this.resellingCreditInstance._address)})`)
  console.log(`\n${colors.white('-------------------------------------------------------------------')}`)

  // Create a new RegenerationCredit SC instance from TokenManager account.
  console.log(`\n${colors.white('Deploying RegenerationCredit SC...')}`)
  this.regenerationCreditInstance = await SharedUtils.createNewRegenerationCreditInstance(
    process.env.INITIAL_SUPPLY,
    this.accounts.tokenManager,
  )
  console.log(`\n${colors.green('RegenerationCredit SC Address')} -> (${colors.magenta(this.regenerationCreditInstance._address)})`)
  console.log(`\n${colors.white('-------------------------------------------------------------------')}`)

  // Create a new ReclotheShop SC instance from Reclothes Dealer account.
  console.log(`\n${colors.white('Deploying ReclothesShop SC...')}`)
  this.reclothesShopInstance = await SharedUtils.createNewReclothesShopInstance(
    this.resellingCreditInstance._address,
    this.regenerationCreditInstance._address,
    this.accounts.reclothesDealer,
  )
  console.log(`\n${colors.green('ReclothesShop SC Address')} -> (${colors.magenta(this.reclothesShopInstance._address)})`)
  console.log(`\n${colors.white('-------------------------------------------------------------------')}`)

  console.log(`\n${colors.yellow('Smart Contract Method Interactions')}`)

  console.log(`\n${colors.white('Transfer 1000000 RSC Tokens to Reclothes Dealer')}`)
  await this.resellingCreditInstance.methods.transfer(
    this.accounts.reclothesDealer,
    1000000,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.tokenManager,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Register as Customer (Customer1)')}`)
  await this.reclothesShopInstance.methods.registerAsCustomer()
    .send({
      ...this.transactionParameters,
      from: this.accounts.customer1,
    })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Register as Customer (Customer2)')}`)
  await this.reclothesShopInstance.methods.registerAsCustomer()
    .send({
      ...this.transactionParameters,
      from: this.accounts.customer2,
    })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Grant Recycler Role to the user (Recycler1)')}`)
  await this.reclothesShopInstance.methods.grantRecyclerRole(
    this.accounts.recycler1,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Transfer 500000 RGC Tokens to Recycler1')}`)
  await this.regenerationCreditInstance.methods.transfer(
    this.accounts.recycler1,
    500000,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.tokenManager,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Grant Recycler Role to the user (Recycler2)')}`)
  await this.reclothesShopInstance.methods.grantRecyclerRole(
    this.accounts.recycler2,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.reclothesDealer,
  })
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.white('Transfer 500000 RGC Tokens to Recycler2')}`)
  await this.regenerationCreditInstance.methods.transfer(
    this.accounts.recycler2,
    500000,
  ).send({
    ...this.transactionParameters,
    from: this.accounts.tokenManager,
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
