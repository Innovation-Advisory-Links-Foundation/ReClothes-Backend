require('dotenv').config()
const Web3 = require('web3')
const colors = require('colors')
const SharedUtils = require('../shared/utils')
const fs = require('fs')
const path = require('path')
const EEAClient = require('web3-eea')
const {
  sendBoxForEvaluation,
  evaluateBox,
} = require('../shared/privacyGroupHelpers')

const mockedDealerBoxes = require('../mocks/dealerBoxes.json')

const PrivateReclothesShopAbi = require('../build/contracts/PrivateReclothesShop.json').abi
const PrivateReclothesShopBinary = fs.readFileSync(
  path.join(__dirname, '../contracts/binaries/_contracts_PrivateReclothesShop_sol_PrivateReclothesShop.bin'),
)

// Orion nodes keys.
const orion1PubKey = process.env.ORION1_PUBLIC_KEY
const orion3PubKey = process.env.ORION3_PUBLIC_KEY
const node1PrivKey = process.env.NODE1_PRIVATE_KEY
const node3PrivKey = process.env.NODE3_PRIVATE_KEY

async function main () {
  // Initialize utility class.
  await SharedUtils.init(web3)

  this.transactionParameters = SharedUtils.getTransactionParameters()
  this.accounts = SharedUtils.getBesuAccounts()

  console.log(`\n${colors.yellow('Gathering Public Smart Contract Istances')}`)
  this.resellingCreditInstance = SharedUtils.getResellingCreditSCObject().getInstance(process.env.RESELLING_ADDRESS)
  this.regenerationCreditInstance = SharedUtils.getRegenerationCreditSCObject().getInstance(process.env.REGENERATION_ADDRESS)
  this.reclothesShopInstance = SharedUtils.getReclothesShopSCObject().getInstance(process.env.RECLOTHES_SHOP_ADDRESS)
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.yellow('Initialize Orion1-Orion2 Privacy Group')}`)
  const web3EEANode1 = new EEAClient(new Web3(process.env.NODE1_URL), process.env.CHAIN_ID)
  const web3EEANode3 = new EEAClient(new Web3(process.env.NODE3_URL), process.env.CHAIN_ID)

  // eslint-disable-next-line no-new
  const contract = new web3EEANode1.eth.Contract(PrivateReclothesShopAbi)

  // Retrieve the contructor from PrivateReclothesShop smart contract ABI.
  // eslint-disable-next-line no-underscore-dangle
  const constructorAbi = contract._jsonInterface.find(e => {
    return e.type === 'constructor'
  })

  // Fill in the constructor arguments for private deploy.
  const constructorArgs = web3EEANode1.eth.abi
    .encodeParameters(constructorAbi.inputs, [
      process.env.RESELLING_ADDRESS,
      process.env.REGENERATION_ADDRESS,
      process.env.RECLOTHES_SHOP_ADDRESS,
      [3, 5, 8, 16, 9, 11], // Confidential pricing list.
    ]).slice(2)

  // Setup options for private deploy.
  const contractOptions = {
    data: `0x${PrivateReclothesShopBinary}${constructorArgs}`,
    privateFrom: orion1PubKey,
    privateFor: [orion3PubKey],
    privateKey: node1PrivKey,
  }
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.yellow('Deploy Private SC for Dealer - Recycler1')}`)
  web3EEANode1.eea
    .sendRawTransaction(contractOptions)
    .then(hash => {
      console.log(`Transaction Hash ${hash}`)
      return web3EEANode1.priv.getTransactionReceipt(hash, orion1PubKey)
    })
    .then(privateTransactionReceipt => {
      console.log(`\n${colors.green('Done!')}`)
      return privateTransactionReceipt.contractAddress
    })
    .then(contractAddress => {
      console.log(`\n${colors.green('PrivateReclothesShop SC Address')} -> (${colors.magenta(contractAddress)})`)

      console.log(`\n${colors.yellow('Send Confidential Box for Evaluation')}`)
      return sendBoxForEvaluation(
        web3EEANode1,
        PrivateReclothesShopAbi,
        orion1PubKey,
        orion3PubKey,
        node1PrivKey,
        contractAddress,
        mockedDealerBoxes[2].id,
        mockedDealerBoxes[2].description,
        mockedDealerBoxes[2].clothesTypes,
        mockedDealerBoxes[2].quantities,
      )
        .then(transactionHash => {
          console.log(`\n${colors.green('Done!')}`)
          // Public interaction (ReclothesShop).
          console.log(`\n${colors.yellow('Remove Clothes from Inventory')}`)
          return this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
            mockedDealerBoxes[2].clothesTypes,
            mockedDealerBoxes[2].quantities,
            transactionHash,
          ).send({
            ...this.transactionParameters,
            from: this.accounts.reclothesDealer,
          })
        })
        .then(() => {
          console.log(`\n${colors.green('Done!')}`)
          console.log(`\n${colors.yellow('Evaluate Confidential Box')}`)
          return evaluateBox(
            web3EEANode3,
            PrivateReclothesShopAbi,
            orion3PubKey,
            orion1PubKey,
            node3PrivKey,
            contractAddress,
            mockedDealerBoxes[2].id,
            20,
          )
            .then(transactionHash => {
              console.log(`\n${colors.green('Done!')}`)
              // Public interaction (ReclothesShop).
              console.log(`\n${colors.yellow('Set RGC Tokens Allowance for ReclothesShop SC')}`)
              return this.regenerationCreditInstance.methods.increaseAllowance(
                this.reclothesShopInstance._address,
                50,
              ).send({
                ...this.transactionParameters,
                from: this.accounts.recycler1,
              })
                .then(() => {
                  // Public interaction (ReclothesShop).
                  console.log(`\n${colors.yellow('Transfer the RGC Tokens')}`)
                  return this.reclothesShopInstance.methods.transferRGCForConfidentialTx(
                    30,
                    transactionHash,
                  ).send({
                    ...this.transactionParameters,
                    from: this.accounts.recycler1,
                  })
                })
            })
        })
        .then(() => {
          console.log(`\n${colors.yellow('Send Confidential Box for Evaluation')}`)
          return sendBoxForEvaluation(
            web3EEANode1,
            PrivateReclothesShopAbi,
            orion1PubKey,
            orion3PubKey,
            node1PrivKey,
            contractAddress,
            mockedDealerBoxes[3].id,
            mockedDealerBoxes[3].description,
            mockedDealerBoxes[3].clothesTypes,
            mockedDealerBoxes[3].quantities,
          )
            .then(transactionHash => {
              console.log(`\n${colors.green('Done!')}`)
              // Public interaction (ReclothesShop).
              console.log(`\n${colors.yellow('Remove Clothes from Inventory')}`)
              return this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
                mockedDealerBoxes[3].clothesTypes,
                mockedDealerBoxes[3].quantities,
                transactionHash,
              ).send({
                ...this.transactionParameters,
                from: this.accounts.reclothesDealer,
              })
            })
        })
        .then(() => {
          console.log(`\n${colors.green('Done!')}`)
          console.log(`\n${colors.yellow('Evaluate Confidential Box')}`)
          return evaluateBox(
            web3EEANode3,
            PrivateReclothesShopAbi,
            orion3PubKey,
            orion1PubKey,
            node3PrivKey,
            contractAddress,
            mockedDealerBoxes[3].id,
            25,
          )
            .then(transactionHash => {
              console.log(`\n${colors.green('Done!')}`)
              // Public interaction (ReclothesShop).
              console.log(`\n${colors.yellow('Set RGC Tokens Allowance for ReclothesShop SC')}`)
              return this.regenerationCreditInstance.methods.increaseAllowance(
                this.reclothesShopInstance._address,
                80,
              ).send({
                ...this.transactionParameters,
                from: this.accounts.recycler1,
              })
                .then(() => {
                  // Public interaction (ReclothesShop).
                  console.log(`\n${colors.yellow('Transfer the RGC Tokens')}`)
                  return this.reclothesShopInstance.methods.transferRGCForConfidentialTx(
                    50,
                    transactionHash,
                  ).send({
                    ...this.transactionParameters,
                    from: this.accounts.recycler1,
                  })
                })
            })
        })
        .then(() => {
          console.log(`\n${colors.green('Done!')}`)
        })
    }).catch(e => {
      console.log(e)
    })
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
