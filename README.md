# AMM_Arb_testing
Experimental AMM arbitrage repo. Used for POC and development. Production ready iteration will require optimization.

Based on implementation by https://github.com/paco0x/amm-arbitrageur.


### Current Dependencies
- @openzeppelin/contracts ^4.1.0
- @truffle/hdwallet-provider ^1.4.0
- dotenv ^10.0.0
- ethers ^5.3.0
- web3 ^1.3.6
- @flashbots/ethers-provider-bundle ^0.3.1
- bn-chai ^1.0.1
- chai ^4.3.4

### TODO
- Finish writing tests
	- ~~Test internal functions~~
	- Test Swap function (some troubles here integrating with FlashBots)
	- Test arbitrary control functions (i.e. only owner of contract can sign/send transactions to chain)
- Optimize arb strategies
	- ~~implement other trading pairs~~
	- ~~add additional exchanges~~  current version iterates through various uniswap-like exchanges to find "best crossed market" (see Arbitrage.ts and UniswapV2EthPair.ts both pulled from FlashBots example repo with some refactoring)
	- compensate for gas fees (?), miner reward fees (flashbots) and AAVE flashloan fees


## How to use
Currently this repo is in early development stages (several features are still being worked out such as integrating aave flashloans and flashbots support - see TODO section) however most of the tests do currently pass and contracts can be deployed and tested on local node using ganache.

#Requirements
Create a .env file and store:
- infura api key
- private wallet key

install ganache-cli and spin up a local mainnet node (update the truffle-config file with the respective network information)

Deploy the BundleExecutor contract and note the address (constructor takes wallet address - this can be set to arbitrary wallet created by ganache)
```
truffle migrate --f 2 --network development

```
Ensure the development network is defined in truffle-config.js

Run tests:
```
truffle test ./test/[TEST_NAME]

```



