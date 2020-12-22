const { accounts } = require('../shared/utils')

require('dotenv').config()

const ResellingCredit = artifacts.require('ResellingCredit')
const RegenerationCredit = artifacts.require('RegenerationCredit')
const ReclothesShop = artifacts.require('ReclothesShop')

module.exports = function (deployer, network, accounts) {
  if (network === 'besu') {
    deployer.deploy(
      ResellingCredit,
      process.env.INITIAL_SUPPLY,
      { from: process.env.TOKEN_MANAGER_ACCOUNT },
    ).then(() => {
      deployer.deploy(
        RegenerationCredit,
        process.env.INITIAL_SUPPLY,
        { from: process.env.TOKEN_MANAGER_ACCOUNT },
      ).then(() => {
        return deployer.deploy(
          ReclothesShop,
          ResellingCredit.address,
          RegenerationCredit.address,
          { from: process.env.RECLOTHE_ADMIN_ACCOUNT },
        )
      })
    })
  }
}
