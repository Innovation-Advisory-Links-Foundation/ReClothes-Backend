# ReClothes Backend
Build decentralized applications (*dApps*) on top of the Ethereum blockchain using the latest *bleeding-edge* technologies and tools to accelerate the development process with a reliable, modern, fast, and customizable approach.

You can find a simple decentralized Crowdfunding dApp example built using this boilerplate on branch `example`.


## Table of Contents
- [What is an Ethereum dApp?](#what-is-an-ethereum-dapp)
- [What is Included?](#what-is-included)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
    - [Prerequisities](#prerequisities)
    - [Initialization](#initialization)
    - [Local Usage](#local-usage)
    - [Public Network Usage](#public-network-usage)
- [Development Rules](#development-rules)
    - [Commit](#commit)
    - [Branch](#branch)
- [License](#license)

### What is an Ethereum dApp?
*DApp* (or *dApp*) is an abbreviated form for Decentralized Application, a computer application that runs on a distributed computing system. 

In a classical software application approach, the code runs on centralized servers (e.g., AWS or NodeJS). However, in a full-decentralized process, the dApp has its backend code running on a decentralized peer-to-peer network (e.g., Ethereum Blockchain smart contracts) as well as its frontend application running on a decentralized storage system (e.g., Swarm or IPFS). The frontend calls the backend blockchain nodes directly through RPC endpoints.

<div align="center">
    <img 
        align="center" 
        src="./resources/Ethereum_dApp_architecture.png" 
        alt="An overview of an Ethereum dApp Architecture"
    />
    </div>
<p align="center"> <i>Figure 1.</i> An overview of an Ethereum dApp Architecture. </p>

This repository is focused on help you deploying, testing, and populating the smart contract (SC) business logic of your application in a local and remote (public networks) environment.


### What is Included?
Your environment will have everything you need to build a modern Ethereum dApp backend:

* A development environment, testing framework, and asset pipeline for the Ethereum Virtual Machine (EVM). [[Truffle](https://github.com/trufflesuite/truffle)]
* A well-written set of Ethereum JavaScript API connects to the Generic JSON-RPC spec used to communicate with the nodes of an Ethereum-like blockchain. [[web3js](https://github.com/ethereum/web3.js/)]
* A personal blockchain node and a CLI to interact with it. [[Ganache](https://github.com/trufflesuite/ganache)]
* A set of smart contract standard libraries that help you to minimize development risk. [[OZ Contracts](https://openzeppelin.com/contracts/)]
* Assertion libraries for smart contract testing. [[OZ TestHelpers](https://docs.openzeppelin.com/test-helpers/0.5/), [Chai](https://www.chaijs.com/)]
* Linters for statical analysis of your JavaScript and Solidity code. [[ESLint](https://eslint.org/), [SolHint](https://protofire.github.io/solhint/)]

## Folder Structure
```
├── contracts
│   ├── Migration.sol
│   └── MyContract.sol
├── migrations
│   ├── 1_initial_migration.js
│   └── 2_myContract_migration.js
├── mocks
│   └── mock.json 
├── scripts
│   └── script.js 
├── shared
│   └── utils.js 
├── test
│   └── myContract.test.js 
├── truffle-config.js
├── .env.default
├── .eslintrc.json
├── .solhint.json
├── .package.json
├── .gitignore
├── .README.md
```
No configuration or complicated folder structures, only the files you need to start fast. The files inside each folder (e.g., MyContract.sol, script.js) are to be considered placeholders that must be modified with your application logic and flow.

* **`contracts`**: Solidity source files for Ethereum smart contracts (Solidity language). It also contains an essential contract in here called *Migrations.sol*, which is used by Truffle to handle smart contracts deployment, keeping track of changes (i.e., if no changes occur, it doesn't deploy your smart contract twice).
* **`migrations`**: Truffle uses a migration system to manage smart contract deployments. The Truffle configuration file is located inside the project main  folder. 
* **`mocks`**: Contains raw JSON data used to populate your smart contract after the deploy. The definition of mocked data is related to your business logic.
* **`scripts`**: One or more JavaScript files used to interact with your smart contract after the deploy. They can use the mocked data as parameters value to pass for method calls.
* **`test`**: One or more JavaScript files used to test the smart contracts functionalities.
* **`shared`**: An utility custom and extensible set of classes provide a standard interface for deploying different instances of your smart contracts and sending transactions to interact with them.

## Getting Started

### Prerequisities
You need to have the following installed:

* [git](https://git-scm.com/downloads) >= *2.21.0*
* [node](https://nodejs.org/en/download/) >= *10.15.3*
* [npm](https://www.npmjs.com/get-npm) >= *6.14.8*

### Initialization
Clone the repository and install the packages:

```bash
git clone https://github.com/Innovation-Advisory-Links-Foundation/Ethereum-Backend-Boilerplate.git
cd Ethereum-Backend-Boilerplate
npm install
```

Make a copy of the `.env.default` file and rename it `.env`. The new file will contain the following data:

```bash
DEV_HOST=localhost
DEV_PORT=8545
ACCOUNT_NUMBER=20
DEV_MNEMONIC="YOUR-12-WORDS-HERE-FOR-DEVELOPMENT-USAGE"
NET_MNEMONIC="YOUR-12-WORDS-HERE-FOR-TESTNET-USAGE"
INFURA_PROJECT_ID="YOUR-INFURA-PROJECT-ID-HERE"
```

* The `DEV_HOST` and `DEV_PORT` values are related to the Ganache node connection endpoint. 
* The `ACCOUNT_NUMBER` indicates how many accounts are you planning to use during the development. 
* The mnemonics are the 12-words code strings used for generating deterministic keys. Your `DEV_MNEMONIC` must refer to local development keys, and your `NET_MNEMONIC` must refer to public net development keys. 
* The `INFURA_PROJECT_ID` is a 32 characters string used to identify your project unique identifier. (*NB.* You need to [register](https://infura.io/register) to Infura to obtain a custom provider access for Ethereum public network connection. Follow this [guide](https://www.trufflesuite.com/tutorials/using-infura-custom-provider) if you have any problems).

To compile your Solidity SC code (this creates a new folder `build/` containing SC schema in JSON format): 

```bash
npm run compile
```

Run ESLint to check the syntax and style of your JavaScript code.

```bash
npm run lint-js
```

Run SolHint to check the syntax and style of your Solidity code.

```bash
npm run lint-sol
```

### Local Usage
Start a local Ganache node:

```bash
npm run ganache
```

Migrate (deploy) your smart contracts:

```bash
npm run deploy-dev
```

You can run a script (specify your script file name in `package.json`):

```bash
npm run script-dev
```

You can run tests:

```bash
npm run test
```

### Public Network Usage
Migrate (deploy) your smart contracts. The migration will happen on the public network specified in the `truffle-config.js` file (default: *ropsten*):

```bash
npm run deploy-net
```

You can run a script (specify your script file name in `package.json`). May take a while due to gas pricing and network latency:

```bash
npm run script-net
```

##  Development Rules

### Commit

See how a minor change to your commit message style can make you a better programmer.

Format: `<type>(<scope>): <subject>`

`<scope>` is optional

#### Example

```
feat: add hat wobble
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
```

More Examples:

- `feat`: (new feature for the user, not a new feature for build script)
- `fix`: (bug fix for the user, not a fix to a build script)
- `docs`: (changes to the documentation)
- `style`: (formatting, missing semicolons, etc.; no production code change)
- `refactor`: (refactoring production code, e.g., renaming a variable)
- `test`: (adding missing tests, refactoring tests; no production code change)
- `chore`: (updating grunt tasks etc.; no production code change)

**References**:

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic_commit_messages)
- [Git Commit Msg](http://karma-runner.github.io/1.0/dev/git-commit-msg.html)

### Branch

* The *master* branch must be used for releases only.
* There is a dev branch, used to merge all sub dev branch.
* Avoid long descriptive names for long-lived branches.
* No CamelCase.
* Use grouping tokens (words) at the beginning of your branch names (in a similar way to the `type` of commit).
* Define and use small lead tokens to differentiate branches in a meaningful way to your workflow.
* Use slashes to separate parts of your branch names.
* Remove branch after merge if it is not essential.

Examples:
    
    git branch -b docs/README
    git branch -b test/one-function
    git branch -b feat/side-bar
    git branch -b style/header

## License
This repository is released under the [MIT](https://github.com/Innovation-Advisory-Links-Foundation/Ethereum-Backend-Boilerplate/blob/master/LICENSE) License.

---
Ethereum Backend Boilerplate © 2020+, [LINKS Foundation](https://linksfoundation.com/)