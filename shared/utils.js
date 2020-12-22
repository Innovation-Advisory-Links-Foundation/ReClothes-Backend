require('dotenv').config()
// Contract JSON compilation data.
const ResellingCredit = require('../build/contracts/ResellingCredit.json')
const RegenerationCredit = require('../build/contracts/RegenerationCredit.json')
const ReclothesShop = require('../build/contracts/ReclothesShop.json')
const PrivateReclothesShop = require('../build/contracts/PrivateReclothesShop.json')

// An utility class used to reduce test code duplications and errors.
class SharedUtils {
  /**
     * Initialization of shared object and functionalities for interacting with the Crowdfunding and Project
     * smart contracts. This class can be used either for test and script purposes.
     * @param {Object} web3 web3js library instance (provider from `truffle exec`).
     */
  async init (web3) {
    // Local web3 instance mirror.
    this._web3 = web3

    // Get accounts from current web3 instance.
    this.accounts = await web3.eth.getAccounts()

    // The parameters used when sending a transaction.
    this._transactionParameters = {
      gas: (await web3.eth.getBlock('latest')).gasLimit, // Current gas limit.
      gasPrice: await web3.eth.getGasPrice(), // Current gas price.
      data: '', // Data to sign (default null).
      from: this.accounts[0], // Default account (NB. use only for getters, override when sending txs).
    }

    // Symbolic account roles for testing purposes.
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

    // Besu accounts.
    this._besuAccounts = {
      tokenManager: this.accounts[0],
      reclothesDealer: this.accounts[1],
      customer1: this.accounts[2],
      customer2: this.accounts[3],
      recycler1: this.accounts[4],
      recycler2: this.accounts[5],
    }

    // Smart Contract class instances.
    // (NB. these are not SC instances but you can instance one or more SC from these).
    this._ResellingCredit = new SmartContract('ResellingCredit', ResellingCredit, this._web3)
    this._RegenerationCredit = new SmartContract('RegenerationCredit', RegenerationCredit, this._web3)
    this._ReclothesShop = new SmartContract('ReclothesShop', ReclothesShop, this._web3)
    this._PrivateReclothesShop = new SmartContract('PrivateReclothesShop', PrivateReclothesShop, this._web3)
  }

  /**
  * Deploy a new ResellingCredit token smart contract on the network.
  * @param {number} initialSupply The initial amount of tokens to be minted.
  * @param {string} tokenManager EOA of the user who deploy the contract and manages the tokens.
  * @returns {Object} The new ResellingCredit smart contract instance.
  */
  async createNewResellingCreditInstance (initialSupply, tokenManager) {
    // Create the JSON interface from ABI.
    const resellingCreditContract = new this._web3.eth.Contract(this._ResellingCredit.getABI())

    // Deploy and return the Crowfunding SC instance.
    return await resellingCreditContract.deploy({
      data: this._ResellingCredit.getBytecode(),
      arguments: [initialSupply],
    }).send({
      ...this._transactionParameters,
      from: tokenManager,
    })
  }

  /**
  * Deploy a new RegenerationCredit token smart contract on the network.
  * @param {number} initialSupply The initial amount of tokens to be minted.
  * @param {string} tokenManager EOA of the user who deploy the contract and manages the tokens.
  * @returns {Object} The new RegenerationCredit smart contract instance.
  */
  async createNewRegenerationCreditInstance (initialSupply, tokenManager) {
    // Create the JSON interface from ABI.
    const regenerationCreditContract = new this._web3.eth.Contract(this._RegenerationCredit.getABI())

    // Deploy and return the Crowfunding SC instance.
    return await regenerationCreditContract.deploy({
      data: this._RegenerationCredit.getBytecode(),
      arguments: [initialSupply],
    }).send({
      ...this._transactionParameters,
      from: tokenManager,
    })
  }

  /**
  * Deploy a new ReclothesShop Smart Contract on the network.
  * @param {string} resellingCreditAddress The address of the ResellingCredit smart contract.
  * @param {string} regenerationCreditAddress The address of the RegenerationCredit smart contract.
  * @param {string} reclothesDealerAccount EOA of the user who has the Reclothes Dealer rights.
  * @returns {Object} The ReclothesShop smart contract instance.
  */
  async createNewReclothesShopInstance (resellingCreditAddress, regenerationCreditAddress, reclothesDealerAccount) {
    // Create the JSON interface from ABI.
    const reclothesShopSC = new this._web3.eth.Contract(this._ReclothesShop.getABI())

    // Deploy and return the Crowfunding SC instance.
    return await reclothesShopSC.deploy({
      data: this._ReclothesShop.getBytecode(),
      arguments: [resellingCreditAddress, regenerationCreditAddress],
    }).send({
      ...this._transactionParameters,
      from: reclothesDealerAccount,
    })
  }

  /**
  * Deploy a new PrivateReclothesShop Smart Contract on the network.
  * @param {string} resellingCreditAddress The address of the ResellingCredit smart contract.
  * @param {string} regenerationCreditAddress The address of the RegenerationCredit smart contract.
  * @param {string} reclothesShopAddress The address of the ReclothesShop smart contract.
  * @param {string} confidentialPricingArray A list of confidential evaluation pricing list.
  * @param {string} reclothesDealerAccount EOA of the user who has the Reclothes Dealer rights.
  * @returns {Object} The PrivateReclothesShop smart contract instance.
  */
  async createNewPrivateReclothesShopInstance (resellingCreditAddress, regenerationCreditAddress, reclothesShopAddress, confidentialPricingArray, reclothesDealerAccount) {
    // Create the JSON interface from ABI.
    const privateReclothesShopSC = new this._web3.eth.Contract(this._PrivateReclothesShop.getABI())

    // Deploy and return the Crowfunding SC instance.
    return await privateReclothesShopSC.deploy({
      data: this._PrivateReclothesShop.getBytecode(),
      arguments: [resellingCreditAddress, regenerationCreditAddress, reclothesShopAddress, confidentialPricingArray],
    }).send({
      ...this._transactionParameters,
      from: reclothesDealerAccount,
    })
  }

  /**
    * Return the list of the account addresses.
    * @returns {string[]} Account list.
    */
  getAccounts () {
    return this._accounts
  }

  /**
    * Return the list of the test accounts addresses.
    * @returns {string[]} Test accounts list.
    */
  getTestAccounts () {
    return this._testAccounts
  }

  /**
    * Return the list of the besu account addresses.
    * @returns {string[]} Account list.
    */
  getBesuAccounts () {
    return this._besuAccounts
  }

  /**
    * Return the default transaction parameters.
    * @returns {Object} Default transaction parameter.
    */
  getTransactionParameters () {
    return this._transactionParameters
  }

  /**
    * Return the ResellingCredit Smart Contract object.
    * @returns {Object} MyContract ResellingCredit class object.
    */
  getResellingCreditSCObject () {
    return this._ResellingCredit
  }

  /**
    * Return the RegenerationCredit Smart Contract object.
    * @returns {Object} MyContract RegenerationCredit class object.
    */
  getRegenerationCreditSCObject () {
    return this._RegenerationCredit
  }

  /**
    * Return the ReclothesShop Smart Contract object.
    * @returns {Object} MyContract ReclothesShop class object.
    */
  getReclothesShopSCObject () {
    return this._ReclothesShop
  }

  /**
    * Return the PrivateReclothesShop Smart Contract object.
    * @returns {Object} MyContract PrivateReclothesShop class object.
    */
  getPrivateReclothesShopSCObject () {
    return this._PrivateReclothesShop
  }
}

// A class used to define a set of getters utilities (metadata, istance, and events).
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
      * Return the Smart Contract ABI object.
      * @returns {Object} Smart Contract ABI object.
      */
  getABI () {
    return this._abi
  }

  /**
      * Return the Smart Contract Bytecode string.
      * @returns {string} Smart Contract Bytecode string.
      */
  getBytecode () {
    return this._bytecode
  }

  /**
      * Return a Smart Contract instance given its address.
      * @param contractAddress Smart Contract address.
      * @returns {Contract} Smart Contract instance.
      */
  getInstance (contractAddress) {
    return new this._web3.eth.Contract(this._abi, contractAddress)
  }

  /**
      * Return event arguments.
      * @param transactionHash The transaction where the event has been emitted.
      * @param eventName The event name
      * @returns {Promise<Object>} A Promise with a list of event objects.
      */
  async getEventArguments (transactionHash, eventName) {
    // Get all transaction logs.
    const { logs } = await this._web3.eth.getTransactionReceipt(transactionHash)

    // Get the event ABI.
    const eventABI = this._artifact.options.jsonInterface.filter(x => x.type === 'event' && x.name === eventName)[0]

    // The first topic will equal the hash of the event signature.
    const eventSignature = `${eventName}(${eventABI.inputs.map(input => input.type).join(',')})`
    const eventTopic = this._web3.utils.sha3(eventSignature)

    // Only decode events of type 'eventName'.
    const log = logs.find(log => log.topics.length > 0 && log.topics[0] === eventTopic)

    // Decode found log.
    return this._web3.eth.abi.decodeLog(eventABI.inputs, log.data, log.topics.slice(1))
  }
}

module.exports = new SharedUtils()
