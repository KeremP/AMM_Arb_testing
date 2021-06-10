# AMM_Arb_testing
Experimental AMM arbitrage repo. Used for POC and development. Production ready iteration will require optimization.

Based on implementation by https://github.com/paco0x/amm-arbitrageur.

### Current Dependencies
- @openzeppelin/contracts ^4.1.0
- @truffle/hdwallet-provider ^1.4.0
- dotenv ^10.0.0
- ethers ^5.3.0
- web3 ^1.3.6


### TODO
- Finish writing tests
	- ~~Test internal functions~~
	- Test Swap function
	- Test arbitrary control functions (i.e. only owner of contract can sign/send transactions to chain)
- Write Node driver script
- Optimize arb strategies
	- implement other trading pairs
	- account for slippage
	- add additional exchanges
	- compensate for gas fees (?)
