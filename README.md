# ReClothes

**A decentralized solution for second-hand clothes recycles in the fashion industry.**

* Designed as an enterprise blockchain-based network on [Hyperledger Besu](https://besu.hyperledger.org/en/stable/).
* Allows **confidential** transactions visible only among business partners while keeping a transparent public history of quantities, processes, events, and payments.
* Encourages individuals' participation in the circular economy through a *double-incentive* using two [ERC20](https://docs.openzeppelin.com/contracts/erc20) token implementations, automating payments and rewarding mechanisms.
* Provides a *public* interface for people who wants to support the eco-friendly fashion industry by sending second-hand clothes and/or buying upcycled clothes.

You can learn more about the main challenges of the fashion sector and our solution's design to the article on our [OverTheBlock Medium](https://medium.com/overtheblock/reclothes-a-blockchain-based-solution-for-second-hand-clothes-market-ca2061080e3c) page.

To learn more about ReClothes smart contracts, check the [README](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/contracts/README.md) in the `/contracts` folder.

## Table of Contents
- [Workflow](#workflow)
- [Backend](#backend)
- [Getting Started](#getting-started)
    - [Prerequisities](#prerequisities)
    - [Configuration](#configuration)
    - [Using Hyperledger Besu](#using-hyperledger-besu)
    - [Deploying ReClothes Smart Contracts](#deploying-reclothes-smart-contracts)
    - [Using Ganache](#using-ganache)
- [Development Rules](#development-rules)
    - [Commit](#commit)
    - [Branch](#branch)
- [License](#license)

## Workflow

<div align="center">
    <img 
        align="center" 
        src="./workflow.svg" 
        alt="An high-level representation of ReClothes solution workflow"
    />
    </div>
<p align="center"> <i>Figure 1.</i> A high-level representation of ReClothes solution workflow </p>

Figure 1 shows a high-level representation of the actors and the workflow of their features in ReClothes. The designed solution involves three different actors: 
* **ReClothes Dealer**: who represents a company operating in the fashion market, 
* **Recyclers**: who represents companies or entities which are involved in commercial relationships regarding clothes recycling activities and,
* **Customers**: who represents people interested in sending second-hand clothes and/or buying upcycled clothes.

The information regarding Customers and ReClothes Dealer interactions is *publicly* available and verifiable by anyone. Instead, the information between ReClothes Dealer and Recycler(s) is *confidential*. (i.e., visible and verifiable only by the participants who took part in the interaction). 

## Backend
A complete and customizable backend built using the [Truffle](https://www.trufflesuite.com) suite. The entire on-chain business logic for the ReClothes dApp is written in [Solidity](https://solidity.readthedocs.io/) smart contracts and can be released in development or production-like networks. You can run an EVM-based blockchain node using the [Ganache-CLI](https://github.com/trufflesuite/ganache-cli) to test smart contract functionalities without paying any fee. You can run a prepackaged Docker playground, simulating a production-like release, consisting of a network with [Hyperledger Besu](https://besu.hyperledger.org/en/stable/) nodes configured for private transactions using a private transaction manager ([Orion](https://besu.hyperledger.org/en/stable/HowTo/Use-Privacy/Run-Orion-With-Besu/)). A customizable [utility class](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/shared/utils.js) helps you carry out tests and deploy smart contract instances and populate them, using simple scripts written in JavaScript, using mock data in JSON format.

## Getting Started

### Prerequisities
You need to have the following installed:

* [git](https://git-scm.com/downloads) >= *2.21.0*
* [node](https://nodejs.org/en/download/) >= *10.16.0*
* [npm](https://www.npmjs.com/get-npm) >= *6.14.4*
* [docker](https://www.docker.com/products/docker-desktop) >= *20.10.0*

### Configuration
Clone the repository and install the packages:

```bash
git clone https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend.git
cd ReClothes-Backend
npm install
```

Make a copy of the `.env.default` file and rename it `.env`. The new file will contain the following data:

```bash
DEV_HOST=localhost
DEV_PORT=8545
CHAIN_ID=2018
ACCOUNT_NUMBER=20
DEV_MNEMONIC="YOUR-DEVELOPMENT-MNEMONIC"
BESU_MNEMONIC="YOUR-BESU-PRODUCTION-MNEMONIC"
TOKEN_MANAGER_ACCOUNT="YOUR-TOKEN-MANAGER-EOA"
RECLOTHES_DEALER_ACCOUNT="YOUR-RECLOTHES-DEALER-EOA"
INITIAL_SUPPLY=5000000000
RESELLING_ADDRESS="YOUR-RESELLINGCREDIT-SMART-CONTRACT-INSTANCE-ADDRESS"
REGENERATION_ADDRESS="YOUR-REGENERATIONCREDIT-SMART-CONTRACT-INSTANCE-ADDRESS"
RECLOTHES_SHOP_ADDRESS="YOUR-RECLOTHESSHOP-SMART-CONTRACT-INSTANCE-ADDRESS"
ORION1_PUBLIC_KEY="YOUR-ORION1-PUBLIC-KEY"
ORION2_PUBLIC_KEY="YOUR-ORION2-PUBLIC-KEY"
ORION3_PUBLIC_KEY="YOUR-ORION3-PUBLIC-KEY"
NODE1_PRIVATE_KEY="YOUR-NODE1-PRIVATE-KEY"
NODE2_PRIVATE_KEY="YOUR-NODE2-PRIVATE-KEY"
NODE3_PRIVATE_KEY="YOUR-NODE3-PRIVATE-KEY"
NODE1_URL="YOUR-NODE1-HOST-AND-PORT-URL"
NODE2_URL="YOUR-NODE2-HOST-AND-PORT-URL"
NODE3_URL="YOUR-NODE3-HOST-AND-PORT-URL"
```

* The `DEV_HOST` and `DEV_PORT` values are related to the development node connection endpoint (URL) and port. The default values are `localhost` and `8545` when using a local development Ganache node.
* The `CHAIN_ID` indicates the unique blockchain network identifier. You need to set this value to `2018` when using a Hyperledger Besu network.
* The `ACCOUNT_NUMBER` represents the number of Ethereum development account created using the `DEV_MNEMONIC` for Ganache local development. The default value is `20`.
* The mnemonics are the 12-words code strings used for generating deterministic keys and are related to your Ethereum wallet. The `DEV_MNEMONIC` is used for Ganache local development, and the `BESU_MNEMONIC` is used for Besu. You could use the same mnemonic for all three fields, although it is not recommended.
* The `TOKEN_MANAGER_ACCOUNT` and `RECLOTHES_DEALER_ACCOUNT` are the Ethereum accounts associated, respectively, to ReClothes Token Manager and Dealer roles (*NB.* The files inside the `/scripts` folder uses your wallet' first account as Token Manager and second account as ReClothes Dealer).
* The `INITIAL_SUPPLY` indicates the amount of RSC and RGC tokens to be mint. The default value is `5000000000`.
* The `NODE1_URL`, `NODE2_URL` and, `NODE3_URL` are the URLs of the Besu nodes (*NB.* The default values for the quickstart are `"http://localhost:20000"`, `"http://localhost:20002"` and, `"http://localhost:20004"`).
* The `NODE1_PRIVATE_KEY`, `NODE2_PRIVATE_KEY` and, `NODE3_PRIVATE_KEY` are the private keys used to sign transactions from the Besu nodes (*NB.* The default values for the quickstart are `"8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63"`, `"c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"` and, `"ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"`. Note that in a real chain, the private key should not be stored").
* The `ORION1_PUBLIC_KEY`, `ORION2_PUBLIC_KEY` and, `ORION3_PUBLIC_KEY` are the private keys used to sign confidential transactions from the Orion nodes (*NB.* The default values for the quickstart are `"A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo="`, `"Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs="` and, `"k2zXEin4Ip/qBGlRkJejnGWdP9cjkK+DAvKNW31L2C8="`).

To compile the smart contract Solidity code (this creates a new folder `build/` containing the schema in JSON format of the smart contracts): 

```bash
npm run compile
```

### Using Hyperledger Besu
A prepackaged Docker playground consisting of a network with Hyperledger Besu nodes, correctly configured with the related Orion nodes for private transactions and IBFT2 consensus algorithm, will be used to speed up and facilitate the configuration and usage process on a local Besu network (*nb.* the network is **not** production-ready by any mean). The [Quorum Dev Quickstart](https://github.com/ConsenSys/quorum-dev-quickstart) is composed by 4 Besu validator nodes, one RPC node, respective Orion nodes for confidential transactions, a blockchain explorer ([Alethio Lite Explorer](https://github.com/Alethio/ethereum-lite-explorer)) and some optional monitoring tools ([Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/)). Every content will run on a separate Docker container. You can learn more about the quickstart at this [link](https://github.com/ConsenSys/quorum-dev-quickstart/tree/master/files/besu) or from the official Hyperledger Besu [Private Network Example](https://besu.hyperledger.org/en/stable/Tutorials/Examples/Private-Network-Example/) documentation. 

To download and configure the network:

```bash
npx quorum-dev-quickstart
```

The npx command will prompt a Quorum Quickstart CLI with few answers. We recommend that you give the answers in the following order `1 / N / Y / N` and press Enter next.

To start your test network, open Docker, navigate in the `./quorum-test-network` directory and execute the `run.sh` script:

```bash
cd ./quorum-test-network
./run.sh # on Linux/MacOS
```

#### Deploying ReClothes Smart Contracts
The `/scripts` folder contains the scripts necessary to bootstrap a new instance of ReClothes smart contracts on your Besu network and some additional files for executing mock interactions. Each script will show your terminal the deployed smart contracts (if any) and feedback for the subsequent interactions. Alternatively, you can create your custom scripts or use other mechanisms to bootstrap the ReClothes smart contracts.


The `/scripts/initializeReclothes.js` script will deploy the ERC20 tokens smart contract implementation (`/contracts/ResellingCredit.sol` and `/contracts/RegenerationCredit.sol`) from the Token Manager account and the ReClothes public on-chain business logic (`/contracts/ReclothesShop.sol`) from the Reclothes Dealer account. The script will also interact with the contracts for token distribution and for registering two Customers and two Recyclers (*nb.* the account used are, respectively, the third and fourth for the Customers and the fifth and sixth for the Recyclers from your wallet). 

```bash
npm run initialize-reclothes
```

**Copy these smart contract addresses and paste them on the respective** `.env` **key-value pair**.

Run the `/scripts/mockPublicInteractions.js` script to populate the smart contracts with public interactions between Customers and Dealer.
 
```bash
npm run mock-public-interactions
```

Before running private mock interactions, you need to compile the smart contracts and obtaining the binaries:

```bash
npm run solcjs-binaries
```

Run the `/scripts/mockPrivateInteractions1.js` script to create a private connection (group) between Recycler1 and ReClothes Dealer to perform confidential interactions on a private instance of ReClothes smart contract (`/contracts/PrivateReclothesShop.sol`). The private transactions are signed and executed using the respectively Orion nodes. 
 
```bash
npm run mock-private-interactions1
```

Run the `/scripts/mockPrivateInteractions2.js` script to create a private connection (group) between Recycler2 and ReClothes Dealer to perform confidential interactions on a private instance of ReClothes smart contract (`/contracts/PrivateReclothesShop.sol`). The private transactions are signed and executed using the respectively Orion nodes. 
 
```bash
npm run mock-private-interactions2
```

### Using Ganache
You can start a local Ganache node.

```bash
npm run ganache
```

Migrate (deploy) the ReClothes smart contracts. This script will deploy the ERC20 tokens smart contract implementation (`/contracts/ResellingCredit.sol` and `/contracts/RegenerationCredit.sol`) from the Token Manager account (first Ganache account) and the ReClothes on-chain business logic (`/contracts/ReclothesShop.sol`) from the Reclothes Dealer account (second Ganache account).

```bash
npm run migrate
```

You can run tests on the smart contracts.

```bash
npm run test
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
This repository is released under the [MIT](https://github.com/Innovation-Advisory-Links-Foundation/ReClothes-Backend/blob/main/LICENSE) License.

---
ReClothes Backend © 2020+, [LINKS Foundation](https://linksfoundation.com/)