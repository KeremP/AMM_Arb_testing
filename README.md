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
