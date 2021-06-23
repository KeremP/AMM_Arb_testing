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


const BundleExecutorAddress = "0xC0B5526f4C0e13abaefAB794a7FA564025a59413"; //update this with address of deployed bundle extractor

const minerRewardPercentage = 80;

// const provider = new providers.StaticJsonRpcProvider(process.env.GOERLI);
const provider = new providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET)

const arbitrageSigningWallet = new Wallet(process.env.TEST_KEY); //private key of arbitrary wallet
const flashbotsRelaySigningWallet = new Wallet(getDefaultRelaySigningKey()); //private key of relay signing wallet (must be differnt than bot wallet)

// const FlashBotsUniswapQuery = artifacts.require('FlashBotsUniswapQuery');
// const BundleExecutor = artifacts.require('FlashBotsMultiCall');

//still debugging test
contract('Flash Swap Test', async () => {

  let bundleContract;
  let query;
  let groupedWethMarkets;
  beforeEach( async() => {

    console.log("Searcher wallet address: " + await arbitrageSigningWallet.getAddress());
    console.log("Flashbots signing relay address: " + await flashbotsRelaySigningWallet.getAddress());
  })

  it("take markets", async () => {

    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
    const arbitrage = new Arbitrage(
      arbitrageSigningWallet,
      flashbotsProvider,
      new Contract(BundleExecutorAddress, BUNDLE_EXECUTOR_ABI, provider) //update contract address on ganache fork for testing
    )


    const markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
    // wethPair = new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS,WETH_ADDRESS], PROTOCOL_NAME);
    // console.log(markets);
    console.log('61');
    await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
    console.log('63');
    const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken);
    // console.log(markets.marketsByToken);
    // console.log(bestCrossedMarkets);

    //TODO: fix flashbots transaction simulation
    const balanceBefore = await provider.getBalance("0xC0B5526f4C0e13abaefAB794a7FA564025a59413");
    console.log(balanceBefore.toString());
    arbitrage.takeCrossedMarkets(bestCrossedMarkets, provider.getBlockNumber(), minerRewardPercentage);
    const balanceAfter = await provider.getBalance("0xC0B5526f4C0e13abaefAB794a7FA564025a59413");
    console.log(balanceAfter.toString());

    expect(balanceAfter).to.be.gt(balanceAfter);



  });

});
