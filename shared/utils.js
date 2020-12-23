require('dotenv').config()
const ResellingCredit = require('../build/contracts/ResellingCredit.json')
const RegenerationCredit = require('../build/contracts/RegenerationCredit.json')
const ReclothesShop = require('../build/contracts/ReclothesShop.json')
const PrivateReclothesShop = require('../build/contracts/PrivateReclothesShop.json')

// Utility class for smart contract deploy, interaction and testing.
class SharedUtils {
  /**
     * Object which provides utilities for deploying, interacting and testing ReClothes DApp smart contracts.
     * @param {Object} web3 Web3js library instance (provider from `truffle exec`).
     */
  async init (web3) {
    this._web3 = web3
    this.accounts = await web3.eth.getAccounts()

    // Default transaction parameters.
    this._transactionParameters = {
      gas: (await web3.eth.getBlock('latest')).gasLimit, // Current gas limit.
      gasPrice: await web3.eth.getGasPrice(), // Current gas price.
      data: '', // Data to sign (default null).
      from: this.accounts[0], // Sender account.
    }

    // Symbolic renaming of accounts for testing purposes.
    this._testAccounts = {
      tokenManager: this.accounts[0],
      reclothesDealer: this.accounts[1],
      customer1: this.accounts[2],
      customer2: this.accounts[3],
      customer3: this.accounts[4],
      recycler1: this.accounts[5],
      recycler2: this.accounts[6],
      others: this.accounts.slice(7, process.env.ACCOUNT_NUMBER),
    }

    // Symbolic renaming of accounts for ReClothes DApp initialization on Besu.
    this._besuAccounts = {
      tokenManager: this.accounts[0],
      reclothesDealer: this.accounts[1],
      customer1: this.accounts[2],
      customer2: this.accounts[3],
      recycler1: this.accounts[4],
      recycler2: this.accounts[5],
    }

    // Smart Contract class instances (NB. these are not smart contracts directly deployed on the blockchain. You can deploy the smart contracts from these instances).
    this._ResellingCredit = new SmartContract('ResellingCredit', ResellingCredit, this._web3)
    this._RegenerationCredit = new SmartContract('RegenerationCredit', RegenerationCredit, this._web3)
    this._ReclothesShop = new SmartContract('ReclothesShop', ReclothesShop, this._web3)
    this._PrivateReclothesShop = new SmartContract('PrivateReclothesShop', PrivateReclothesShop, this._web3)
  }

  /**
  * Deploy a new ResellingCredit token smart contract on the selected network.
  * @param {number} initialSupply The starting amount of token.
  * @param {string} tokenManager The EOA of the Token Manager.
  * @returns {Object} ResellingCredit smart contract instance.
  */
  async createNewResellingCreditInstance (initialSupply, tokenManager) {
    // Create the JSON interface from smart contract ABI.
    const resellingCreditContract = new this._web3.eth.Contract(this._ResellingCredit.getABI())

    // Deploy and return the ResellingCredit smart contract instance.
    return await resellingCreditContract.deploy({
      data: this._ResellingCredit.getBytecode(),
      arguments: [initialSupply],
    }).send({
      ...this._transactionParameters,
      from: tokenManager,
    })
  }

  /**
  * Deploy a new RegenerationCredit token smart contract on the selected network.
  * @param {number} initialSupply The starting amount of token.
  * @param {string} tokenManager The EOA of the Token Manager.
  * @returns {Object} RegenerationCredit smart contract instance.
  */
  async createNewRegenerationCreditInstance (initialSupply, tokenManager) {
    // Create the JSON interface from smart contract ABI.
    const regenerationCreditContract = new this._web3.eth.Contract(this._RegenerationCredit.getABI())

    // Deploy and return the RegenerationCredit smart contract instance.
    return await regenerationCreditContract.deploy({
      data: this._RegenerationCredit.getBytecode(),
      arguments: [initialSupply],
    }).send({
      ...this._transactionParameters,
      from: tokenManager,
    })
  }

  /**
  * Deploy a new ReclothesShop smart contract on the selected network.
  * @param {string} resellingCreditAddress The address of the ResellingCredit smart contract.
  * @param {string} regenerationCreditAddress The address of the RegenerationCredit smart contract.
  * @param {string} reclothesDealerAccount The EOA of the ReClothes Dealer.
  * @returns {Object} ReclothesShop smart contract instance.
  */
  async createNewReclothesShopInstance (resellingCreditAddress, regenerationCreditAddress, reclothesDealerAccount) {
    // Create the JSON interface from smart contract ABI.
    const reclothesShopSC = new this._web3.eth.Contract(this._ReclothesShop.getABI())

    // Deploy and return the ReclothesShop smart contract instance.
    return await reclothesShopSC.deploy({
      data: this._ReclothesShop.getBytecode(),
      arguments: [resellingCreditAddress, regenerationCreditAddress],
    }).send({
      ...this._transactionParameters,
      from: reclothesDealerAccount,
    })
  }

  /**
  * Deploy a new PrivateReclothesShop smart contract on the selected network.
  * @param {string} resellingCreditAddress The address of the ResellingCredit smart contract.
  * @param {string} regenerationCreditAddress The address of the RegenerationCredit smart contract.
  * @param {string} reclothesShopAddress The address of the ReclothesShop smart contract.
  * @param {string} confidentialPricingArray The list of confidential evaluation prices in RGC tokens for each cloth type.
  * @param {string} reclothesDealerAccount The EOA of the ReClothes Dealer.
  * @returns {Object} PrivateReclothesShop smart contract instance.
  */
  async createNewPrivateReclothesShopInstance (resellingCreditAddress, regenerationCreditAddress, reclothesShopAddress, confidentialPricingArray, reclothesDealerAccount) {
    // Create the JSON interface from smart contract ABI.
    const privateReclothesShopSC = new this._web3.eth.Contract(this._PrivateReclothesShop.getABI())

    // Deploy and return the PrivateReclothesShop smart contract instance.
    return await privateReclothesShopSC.deploy({
      data: this._PrivateReclothesShop.getBytecode(),
      arguments: [resellingCreditAddress, regenerationCreditAddress, reclothesShopAddress, confidentialPricingArray],
    }).send({
      ...this._transactionParameters,
      from: reclothesDealerAccount,
    })
  }

  /**
    * Return the list of the accounts addresses.
    * @returns {string[]} The accounts addresses list.
    */
  getAccounts () {
    return this._accounts
  }

  /**
    * Return the list of the accounts addresses for testing purposes.
    * @returns {string[]} The accounts addresses list.
    */
  getTestAccounts () {
    return this._testAccounts
  }

  /**
    * Return the list of the accounts addresses for besu usage.
    * @returns {string[]} The accounts addresses list.
    */
  getBesuAccounts () {
    return this._besuAccounts
  }

  /**
    * Return the default transaction parameters object.
    * @returns {Object} Default transaction parameter object.
    */
  getTransactionParameters () {
    return this._transactionParameters
  }

  /**
    * Return the ResellingCredit smart contract class object.
    * @returns {Object} ResellingCredit class object.
    */
  getResellingCreditSCObject () {
    return this._ResellingCredit
  }

  /**
    * Return the RegenerationCredit smart contract class object.
    * @returns {Object} RegenerationCredit class object.
    */
  getRegenerationCreditSCObject () {
    return this._RegenerationCredit
  }

  /**
    * Return the ReclothesShop smart contract class object.
    * @returns {Object} ReclothesShop class object.
    */
  getReclothesShopSCObject () {
    return this._ReclothesShop
  }

  /**
    * Return the PrivateReclothesShop smart contract class object.
    * @returns {Object} PrivateReclothesShop class object.
    */
  getPrivateReclothesShopSCObject () {
    return this._PrivateReclothesShop
  }
}

// Provides useful methods for reading smart contract data and metadata.
class SmartContract {
  constructor (name, schema, web3Instance) {
    this._name = name
    this._schema = schema
    // Get ABI and Bytecode from JSON schema.
    this._abi = schema.abi
    this._bytecode = schema.bytecode
    // Web3 instance.
    this._web3 = web3Instance
  }

  /**
    * Return the smart contract ABI object.
    * @returns {Object} Smart contract ABI object.
    */
  getABI () {
    return this._abi
  }

  /**
    * Return the smart contract Bytecode string.
    * @returns {string} Smart contract Bytecode string.
    */
  getBytecode () {
    return this._bytecode
  }

  /**
    * Return a smart contract instance given its address.
    * @param contractAddress Smart contract address.
    * @returns {Contract} Smart contract instance.
    */
  getInstance (contractAddress) {
    return new this._web3.eth.Contract(this._abi, contractAddress)
  }

  /**
    * Return the smart contract event arguments from event log.
    * @param transactionHash The transaction where the event has been emitted.
    * @param eventName The emitted event name
    * @returns {Promise<Object>} A Promise with a list of event objects.
    */
  async getEventArguments (transactionHash, eventName) {
    // Get all transaction logs.
    const { logs } = await this._web3.eth.getTransactionReceipt(transactionHash)

    // Get the event ABI.
    const eventABI = this._artifact.options.jsonInterface.filter(x => x.type === 'event' && x.name === eventName)[0]

    // The first topic which match the hash of the event signature.
    const eventSignature = `${eventName}(${eventABI.inputs.map(input => input.type).join(',')})`
    const eventTopic = this._web3.utils.sha3(eventSignature)

    // Only decode events of type 'eventName'.
    const log = logs.find(log => log.topics.length > 0 && log.topics[0] === eventTopic)

    // Decode log.
    return this._web3.eth.abi.decodeLog(eventABI.inputs, log.data, log.topics.slice(1))
  }
}

module.exports = new SharedUtils()
