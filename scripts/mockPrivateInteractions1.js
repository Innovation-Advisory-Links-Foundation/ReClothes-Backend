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
  sellUpcycledCloth,
  buyCloth,
} = require('../shared/privacyGroupHelpers')

const mockedDealerBoxes = require('../mocks/dealerBoxes.json')
const mockedUpcycledClothes = require('../mocks/upcycledClothes.json')

const PrivateReclothesShopAbi = require('../build/contracts/PrivateReclothesShop.json').abi
const PrivateReclothesShopBinary = fs.readFileSync(
  path.join(__dirname, '../contracts/binaries/_contracts_PrivateReclothesShop_sol_PrivateReclothesShop.bin'),
)

// Orion nodes keys.
const orion1PubKey = process.env.ORION1_PUBLIC_KEY
const orion2PubKey = process.env.ORION2_PUBLIC_KEY
const node1PrivKey = process.env.NODE1_PRIVATE_KEY
const node2PrivKey = process.env.NODE2_PRIVATE_KEY

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
  const web3EEANode2 = new EEAClient(new Web3(process.env.NODE2_URL), process.env.CHAIN_ID)

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
    privateFor: [orion2PubKey],
    privateKey: node1PrivKey,
  }
  console.log(`\n${colors.green('Done!')}`)

  console.log(`\n${colors.yellow('Deploy PrivateReclothesShop smart contract (Dealer - Recycler1)')}`)
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
        orion2PubKey,
        node1PrivKey,
        contractAddress,
        mockedDealerBoxes[0].id,
        mockedDealerBoxes[0].description,
        mockedDealerBoxes[0].clothesTypes,
        mockedDealerBoxes[0].quantities,
      )
        .then(transactionHash => {
          console.log(`\n${colors.green('Done!')}`)
          // Public interaction (ReclothesShop).
          console.log(`\n${colors.yellow('Remove Clothes from Inventory')}`)
          return this.reclothesShopInstance.methods.decreaseStockForConfidentialBox(
            mockedDealerBoxes[0].clothesTypes,
            mockedDealerBoxes[0].quantities,
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
            web3EEANode2,
            PrivateReclothesShopAbi,
            orion2PubKey,
            orion1PubKey,
            node2PrivKey,
            contractAddress,
            mockedDealerBoxes[0].id,
            15,
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
                    37,
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
          console.log(`\n${colors.yellow('Sell Upcycled Cloth')}`)
          return sellUpcycledCloth(
            web3EEANode2,
            PrivateReclothesShopAbi,
            orion2PubKey,
            orion1PubKey,
            node2PrivKey,
            contractAddress,
            mockedUpcycledClothes[0].id,
            mockedUpcycledClothes[0].price,
            mockedUpcycledClothes[0].clothType,
            mockedUpcycledClothes[0].size,
            mockedUpcycledClothes[0].description,
            mockedUpcycledClothes[0].extClothDataHash,
          )
        })
        .then(() => {
          console.log(`\n${colors.green('Done!')}`)
          console.log(`\n${colors.yellow('Sell another Upcycled Cloth')}`)
          return sellUpcycledCloth(
            web3EEANode2,
            PrivateReclothesShopAbi,
            orion2PubKey,
            orion1PubKey,
            node2PrivKey,
            contractAddress,
            mockedUpcycledClothes[1].id,
            mockedUpcycledClothes[1].price,
            mockedUpcycledClothes[1].clothType,
            mockedUpcycledClothes[1].size,
            mockedUpcycledClothes[1].description,
            mockedUpcycledClothes[1].extClothDataHash,
          )
        })
        .then(() => {
          console.log(`\n${colors.green('Done!')}`)
          console.log(`\n${colors.yellow('Buy an Upcycled Cloth')}`)
          return buyCloth(
            web3EEANode1,
            PrivateReclothesShopAbi,
            orion1PubKey,
            orion2PubKey,
            node1PrivKey,
            contractAddress,
            mockedUpcycledClothes[0].id,
          )
            .then((transactionHash) => {
              console.log(`\n${colors.green('Done!')}`)
              // Public interaction (ReclothesShop).
              console.log(`\n${colors.yellow('Set RSC Tokens Allowance for ReclothesShop SC')}`)
              return this.resellingCreditInstance.methods.increaseAllowance(
                this.reclothesShopInstance._address,
                mockedUpcycledClothes[0].price,
              ).send({
                ...this.transactionParameters,
                from: this.accounts.reclothesDealer,
              })
                .then(() => {
                  // Public interaction (ReclothesShop).
                  console.log(`\n${colors.yellow('Transfer the RSC Tokens')}`)
                  return this.reclothesShopInstance.methods.transferRSCForConfidentialTx(
                    this.accounts.recycler1,
                    mockedUpcycledClothes[0].price,
                    transactionHash,
                  ).send({
                    ...this.transactionParameters,
                    from: this.accounts.reclothesDealer,
                  })
                    .then(() => {
                      // Public interaction (ReclothesShop).
                      console.log(`\n${colors.yellow('Sell Upcycled Cloth for Customers')}`)
                      return this.reclothesShopInstance.methods.sellUpcycledCloth(
                        mockedUpcycledClothes[0].id,
                        mockedUpcycledClothes[0].price,
                        mockedUpcycledClothes[0].clothType,
                        mockedUpcycledClothes[0].size,
                        mockedUpcycledClothes[0].description,
                        mockedUpcycledClothes[0].extClothDataHash,
                        transactionHash,
                      ).send({
                        ...this.transactionParameters,
                        from: this.accounts.reclothesDealer,
                      })
                    })
                })
            })
            .then(() => {
              console.log(`\n${colors.green('Done!')}`)
            })
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
