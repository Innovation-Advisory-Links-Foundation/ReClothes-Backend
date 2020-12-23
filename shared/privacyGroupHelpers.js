/**
  * Return the private deployed smart contract address.
  * @param {Object} web3EEA The instance of the Web3 library using the EEAClient for connecting to a node.
  * @param {string} transactionHash The transaction hash of the deploy transaction.
  * @param {string} orionPublicKey The public key which identifies the specific orion node.
  * @returns {string} The privately deployed smart contract address.
  */
const getPrivateContractAddress = (web3EEA, transactionHash, orionPublicKey) => {
  return web3EEA.priv
    .getTransactionReceipt(transactionHash, orionPublicKey)
    .then(privateTransactionReceipt => {
      return privateTransactionReceipt.contractAddress
    })
}

/**
  * Return the private transaction receipt from a provided private transaction hash.
  * @param {Object} web3EEA The instance of the Web3 library using the EEAClient for connecting to a node.
  * @param {string} transactionHash The transaction hash of the deploy transaction.
  * @param {string} orionPublicKey The public key which identifies the specific orion node.
  * @returns {object} The private transaction receipt.
  */
const getPrivateTransactionReceipt = (web3EEA, transactionHash, orionPublicKey) => {
  return web3EEA.priv
    .getTransactionReceipt(transactionHash, orionPublicKey)
    .then(txReceipt => {
      return txReceipt
    })
}

/**
  * Send a confidential second-hand box.
  * @param {Object} web3EEA The instance of the Web3 library using the EEAClient for connecting to a node.
  * @param {Object} PrivateReclothesShopAbi The set of ABI fo the PrivateReclothesShop smart contract.
  * @param {string} privateFrom The public key which identifies the sender orion node.
  * @param {string} privateFor The public key which identifies the receiver orion node.
  * @param {string} privateKey The private key of the besu node associated to the privateFrom orion node.
  * @param {string} contractAddress The address of the PrivateReclothesShop smart contract.
  * @param {string} boxId The unique numeric id used for identifying the box.
  * @param {string} description A short description of the box content.
  * @param {Array} clothesTypes The clothes types which are contained in the box.
  * @param {Array} quantities A quantity for each cloth type contained in the box.
  * @returns {object} Returns the result of the function call.
  */
const sendBoxForEvaluation = (
  web3EEA,
  PrivateReclothesShopAbi,
  privateFrom,
  privateFor,
  privateKey,
  contractAddress,
  boxId,
  description,
  clothesTypes,
  quantities,
) => {
  const functionAbi = PrivateReclothesShopAbi.find(e => {
    return e.name === 'sendBoxForEvaluation'
  })
  const functionArgs = web3EEA.eth.abi
    .encodeParameters(functionAbi.inputs, [boxId, description, clothesTypes, quantities])
    .slice(2)

  const functionCall = {
    to: contractAddress,
    data: functionAbi.signature + functionArgs,
    privateFrom: privateFrom,
    privateFor: [privateFor],
    privateKey: privateKey,
  }
  return web3EEA.eea.sendRawTransaction(functionCall)
}

/**
  * Evaluate a second-hand confidential box.
  * @param {Object} web3EEA The instance of the Web3 library using the EEAClient for connecting to a node.
  * @param {Object} PrivateReclothesShopAbi The set of ABI fo the PrivateReclothesShop smart contract.
  * @param {string} privateFrom The public key which identifies the sender orion node.
  * @param {string} privateFor The public key which identifies the receiver orion node.
  * @param {string} privateKey The private key of the besu node associated to the privateFrom orion node.
  * @param {string} contractAddress The address of the PrivateReclothesShop smart contract.
  * @param {string} boxId The unique numeric id used for identifying the box.
  * @param {Number} extraAmountRGC An additional remuneration in RGC tokens for the box sender.
  * @returns {object} Returns the result of the function call.
  */
const evaluateBox = (
  web3EEA,
  PrivateReclothesShopAbi,
  privateFrom,
  privateFor,
  privateKey,
  contractAddress,
  boxId,
  extraAmountRGC,
) => {
  const functionAbi = PrivateReclothesShopAbi.find(e => {
    return e.name === 'evaluateBox'
  })
  const functionArgs = web3EEA.eth.abi
    .encodeParameters(functionAbi.inputs, [boxId, extraAmountRGC])
    .slice(2)

  const functionCall = {
    to: contractAddress,
    data: functionAbi.signature + functionArgs,
    privateFrom: privateFrom,
    privateFor: [privateFor],
    privateKey: privateKey,
  }
  return web3EEA.eea.sendRawTransaction(functionCall)
}

/**
  * Sell a new upcycled cloth confidentially to the Dealer.
  * @param {Object} web3EEA The instance of the Web3 library using the EEAClient for connecting to a node.
  * @param {Object} PrivateReclothesShopAbi The set of ABI fo the PrivateReclothesShop smart contract.
  * @param {string} privateFrom The public key which identifies the sender orion node.
  * @param {string} privateFor The public key which identifies the receiver orion node.
  * @param {string} privateKey The private key of the besu node associated to the privateFrom orion node.
  * @param {string} contractAddress The address of the PrivateReclothesShop smart contract.
  * @param {string} clothId The unique numeric id used for identifying the SaleableCloth.
  * @param {Number} rscPrice The price of the SaleableCloth expressed in RSC tokens.
  * @param {Number} clothType The type of cloth to sell.
  * @param {Number} clothSize The size of cloth to sell.
  * @param {String} description A short description of the cloth.
  * @param {String} extClothDataHash A hash of external information related to the dress to sell (e.g., link to the cloth photo).
  * @returns {object} Returns the result of the function call.
  */
const sellUpcycledCloth = (
  web3EEA,
  PrivateReclothesShopAbi,
  privateFrom,
  privateFor,
  privateKey,
  contractAddress,
  clothId,
  rscPrice,
  clothType,
  clothSize,
  description,
  extClothDataHash,
) => {
  const functionAbi = PrivateReclothesShopAbi.find(e => {
    return e.name === 'sellUpcycledCloth'
  })
  const functionArgs = web3EEA.eth.abi
    .encodeParameters(functionAbi.inputs, [clothId, rscPrice, clothType, clothSize, description, extClothDataHash])
    .slice(2)

  const functionCall = {
    to: contractAddress,
    data: functionAbi.signature + functionArgs,
    privateFrom: privateFrom,
    privateFor: [privateFor],
    privateKey: privateKey,
  }
  return web3EEA.eea.sendRawTransaction(functionCall)
}

/**
  * Buy a new upcycled cloth in a confidential privacy group between two nodes.
  * @param {Object} web3EEA The instance of the Web3 library using the EEAClient for connecting to a node.
  * @param {Object} PrivateReclothesShopAbi The set of ABI fo the PrivateReclothesShop smart contract.
  * @param {string} privateFrom The public key which identifies the sender orion node.
  * @param {string} privateFor The public key which identifies the receiver orion node.
  * @param {string} privateKey The private key of the besu node associated to the privateFrom orion node.
  * @param {string} contractAddress The address of the PrivateReclothesShop smart contract.
  * @param {string} clothId The unique numeric id used for identifying the SaleableCloth.
  * @returns {object} Returns the result of the function call.
  */
const buyCloth = (
  web3EEA,
  PrivateReclothesShopAbi,
  privateFrom,
  privateFor,
  privateKey,
  contractAddress,
  clothId,
) => {
  const functionAbi = PrivateReclothesShopAbi.find(e => {
    return e.name === 'buyCloth'
  })
  const functionArgs = web3EEA.eth.abi
    .encodeParameters(functionAbi.inputs, [clothId])
    .slice(2)

  const functionCall = {
    to: contractAddress,
    data: functionAbi.signature + functionArgs,
    privateFrom: privateFrom,
    privateFor: [privateFor],
    privateKey: privateKey,
  }
  return web3EEA.eea.sendRawTransaction(functionCall)
}

module.exports = {
  getPrivateContractAddress,
  getPrivateTransactionReceipt,
  sendBoxForEvaluation,
  evaluateBox,
  sellUpcycledCloth,
  buyCloth,
}
