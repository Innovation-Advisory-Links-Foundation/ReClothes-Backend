require('dotenv').config()
const ResellingCredit = artifacts.require('ResellingCredit')
const RegenerationCredit = artifacts.require('RegenerationCredit')
const ReclothesShop = artifacts.require('ReclothesShop')

module.exports = function (deployer, network, accounts) {
  if(network === "development") {
    let resellingCreditInstance, regenerationCreditInstance
    deployer.then(() => {
      return deployer.deploy(ResellingCredit, process.env.INITIAL_SUPPLY, { from: accounts[0] })
    }).then((RCInstance) => {
      resellingCreditInstance = RCInstance
      return deployer.deploy(RegenerationCredit, process.env.INITIAL_SUPPLY, { from: accounts[0] })
    }).then((RGInstance) => {
      regenerationCreditInstance = RGInstance
      return deployer.deploy(ReclothesShop, resellingCreditInstance.address, regenerationCreditInstance.address, { from: accounts[1] })
    })  
  }
}