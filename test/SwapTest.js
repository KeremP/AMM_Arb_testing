require('dotenv').config();

const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");
const {getBestCrossedMarket, UniswappyV2EthPair, evaluateMarkets } = require("../src/UniswapV2EthPair");
const { UNISWAP_FACTORY_ADDRESS, FACTORY_ADDRESSES, WETH_ADDRESS} = require("../src/addresses");
const { Arbitrage } = require("../src/Arbitrage");
const { get } = require("https");
const { getDefaultRelaySigningKey } = require("../src/utils");
const { BUNDLE_EXECUTOR_ABI } = require("../src/abi.ts");

const { BigNumber, Contract, providers, Wallet } = require("ethers");
const { ETHER } = require("../src/utils");
const { MockProvider, solidity } = require('ethereum-waffle');

const ganache = require("ganache-core");
const chai = require('chai');
var expect = chai.expect;
chai.use(solidity);

const MARKET_ADDRESS = "0x0000000000000000000000000000000000000001"
const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000a"
const PROTOCOL_NAME = "TEST";

const minerRewardPercentage = 80;

// const provider = new providers.StaticJsonRpcProvider(process.env.GOERLI);
const provider = new providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET)

const arbitrageSigningWallet = new Wallet(process.env.TEST_KEY);
const flashbotsRelaySigningWallet = new Wallet(getDefaultRelaySigningKey());

// const FlashBotsUniswapQuery = artifacts.require('FlashBotsUniswapQuery');
// const BundleExecutor = artifacts.require('FlashBotsMultiCall');

//still debugging test
contract('Flash Swap Test', async () => {

  // const DAI = '0xaD6D458402F60fD3Bd25163575031ACDce07538D';
  // const WETH = '0xc778417e063141139fce010982780140aa0cd5ab';
  let bundleContract;
  let query;
  let groupedWethMarkets;
  beforeEach( async() => {
    // query = await FlashBotsUniswapQuery.deployed();
    // bundleContract = await BundleExecutor.deployed();
    // console.log(bundleContract.address);
    console.log("Searcher wallet address: " + await arbitrageSigningWallet.getAddress());
    console.log("Flashbots signing relay address: " + await flashbotsRelaySigningWallet.getAddress());
  })

  it("take markets", async () => {

    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
    const arbitrage = new Arbitrage(
      arbitrageSigningWallet,
      flashbotsProvider,
      new Contract("0xc94459163Fb989e40Af9EF640Ea82d5b22529fD9", BUNDLE_EXECUTOR_ABI, provider) //update contract address on ganache fork for testing
    )


    const markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
    // wethPair = new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS,WETH_ADDRESS], PROTOCOL_NAME);
    console.log(markets.allMarketPairs);
    console.log('61');
    await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
    console.log('63');
    const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken);
    console.log(bestCrossedMarkets);
    const balanceBefore = await provider.getBalance(arbitrageSigningWallet.getAddress());
    console.log(balanceBefore.toString());
    arbitrage.takeCrossedMarkets(groupedWethMarkets, provider.getBlockNumber(), minerRewardPercentage);
    const balanceAfter = await provider.getBalance(arbitrageSigningWallet.getAddress());
    console.log(balanceAfter.toString());

    expect(balanceAfter).to.be.gt(balanceAfter);



  });

});
