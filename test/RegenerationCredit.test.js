require('dotenv').config()
require('web3')
// Import our utilities.
const SharedUtils = require('../shared/utils')
// Import Chai expect interface.
const { expect } = require('chai')

contract('RegenerationCredit', () => {
  before(async function () {
    // Initialize utilities class.
    await SharedUtils.init(web3)

    // Get the default transaction parameters.
    this.transactionParameters = SharedUtils.getTransactionParameters()

    // Get the accounts.
    this.tokenManager = SharedUtils.getTestAccounts().tokenManager
    this.receiver = SharedUtils.getTestAccounts().others[0]

    // Deploy and retrieve a new RegenerationCredit smart contract instance.
    this.regenerationCreditInstance = await SharedUtils.createNewRegenerationCreditInstance(process.env.INITIAL_SUPPLY, this.tokenManager)
  })

  describe('# Initialization', function () {
    it('[1] Should return the same amount for Token Manager\'s account balance and RegenerationCredit contract initial supply', async function () {
      const expectedTokenManagerBalance = await this.regenerationCreditInstance.methods.balanceOf(this.tokenManager).call({
        from: this.tokenManager,
      })

      expect(expectedTokenManagerBalance).to.be.equal(process.env.INITIAL_SUPPLY)
    })
  })

  describe('# RGC Token Transfer', function () {
    it('[2] Should be possible to transfer 10000 RGC tokens from Token Manager to a receiver account', async function () {
      // Transfer the amount of tokens.
      const transactionReceipt = await this.regenerationCreditInstance.methods.transfer(
        this.receiver,
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

      // Get the new balance for the receiver account.
      const expectedReceiverBalance = await this.regenerationCreditInstance.methods.balanceOf(this.receiver).call({
        from: this.tokenManager,
      })

      // Checks.
      expect(from).to.be.equal(this.tokenManager)
      expect(to).to.be.equal(this.receiver)
      expect(parseInt(value)).to.be.equal(10000)
      expect(parseInt(value)).to.be.equal(parseInt(expectedReceiverBalance))
    })
  })

  describe('# Token Allowance', function () {
    it('[3] Should be possible to allow the receiver account to spend 5000 RGC tokens from Token Manager account', async function () {
      // Set token allowance.
      const transactionReceipt = await this.regenerationCreditInstance.methods.increaseAllowance(
        this.receiver,
        5000,
      ).send({
        ...this.transactionParameters,
        from: this.tokenManager,
        nonce: await web3.eth.getTransactionCount(this.tokenManager),
      })

      // Check the event data.
      const owner = transactionReceipt.events.Approval.returnValues.owner
      const spender = transactionReceipt.events.Approval.returnValues.spender
      const value = transactionReceipt.events.Approval.returnValues.value

      // Read the updated allowance for receiver.
      const expectedReceiverAllowance = await this.regenerationCreditInstance.methods.allowance(this.tokenManager, this.receiver).call({
        from: this.tokenManager,
      })

      // Checks.
      expect(owner).to.be.equal(this.tokenManager)
      expect(spender).to.be.equal(this.receiver)
      expect(parseInt(value)).to.be.equal(5000)
      expect(parseInt(value)).to.be.equal(parseInt(expectedReceiverAllowance))
    })

    it('[4] Should be possible for the receiver to spend 2500 RGC tokens from the Token Manager account', async function () {
      // Get the previous balance from receiver.
      const previousReceiverBalance = await this.regenerationCreditInstance.methods.balanceOf(this.receiver).call({
        from: this.receiver,
      })

      // Get the previous balance from Token Manager.
      const previousTokenManagerBalance = await this.regenerationCreditInstance.methods.balanceOf(this.tokenManager).call({
        from: this.receiver,
      })

      // Transfer from Token Manager account sending the tx with the receiver account.
      const transactionReceipt = await this.regenerationCreditInstance.methods.transferFrom(
        this.tokenManager,
        this.receiver,
        2500,
      ).send({
        ...this.transactionParameters,
        from: this.receiver,
        nonce: await web3.eth.getTransactionCount(this.receiver),
      })

      // Check the Approval event data.
      const owner = transactionReceipt.events.Approval.returnValues.owner
      const spender = transactionReceipt.events.Approval.returnValues.spender
      const approvedValue = transactionReceipt.events.Approval.returnValues.value

      // Check the Transfer event data.
      const from = transactionReceipt.events.Transfer.returnValues.from
      const to = transactionReceipt.events.Transfer.returnValues.to
      const transferedValue = transactionReceipt.events.Transfer.returnValues.value

      // Get the updates allowance for receiver.
      const expectedReceiverAllowance = await this.regenerationCreditInstance.methods.allowance(this.tokenManager, this.receiver).call({
        from: this.receiver,
      })

      // Get the updated balance from Token Manager.
      const expectedTokenManagerBalance = await this.regenerationCreditInstance.methods.balanceOf(this.tokenManager).call({
        from: this.receiver,
      })

      // Get the updated balance from receiver.
      const expectedReceiverBalance = await this.regenerationCreditInstance.methods.balanceOf(this.receiver).call({
        from: this.receiver,
      })

      // Checks.
      expect(owner).to.be.equal(this.tokenManager)
      expect(spender).to.be.equal(this.receiver)
      expect(parseInt(approvedValue)).to.be.equal(2500)
      expect(from).to.be.equal(this.tokenManager)
      expect(to).to.be.equal(this.receiver)
      expect(parseInt(transferedValue)).to.be.equal(2500)
      expect(parseInt(approvedValue)).to.be.equal(parseInt(expectedReceiverAllowance))
      expect(parseInt(transferedValue)).to.be.equal(parseInt(previousTokenManagerBalance) - parseInt(expectedTokenManagerBalance))
      expect(parseInt(transferedValue)).to.be.equal(parseInt(expectedReceiverBalance) - parseInt(previousReceiverBalance))
    })

    it('[5] Should be possible for the Token Manager to decrease by 2500 RGC tokens the receiver allowance', async function () {
      // Decrease the token allowance for the receiver.
      const transactionReceipt = await this.regenerationCreditInstance.methods.decreaseAllowance(
        this.receiver,
        2500,
      ).send({
        ...this.transactionParameters,
        from: this.tokenManager,
        nonce: await web3.eth.getTransactionCount(this.tokenManager),
      })

      // Check the event data.
      const owner = transactionReceipt.events.Approval.returnValues.owner
      const spender = transactionReceipt.events.Approval.returnValues.spender
      const value = transactionReceipt.events.Approval.returnValues.value

      // Read the receiver updated allowance.
      const expectedReceiverAllowance = await this.regenerationCreditInstance.methods.allowance(this.tokenManager, this.receiver).call({
        from: this.tokenManager,
      })

      // Checks.
      expect(owner).to.be.equal(this.tokenManager)
      expect(spender).to.be.equal(this.receiver)
      expect(parseInt(value)).to.be.equal(0)
      expect(parseInt(value)).to.be.equal(parseInt(expectedReceiverAllowance))
    })
  })
})
