require('dotenv').config();

const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");
const {getBestCrossedMarket, UniswappyV2EthPair, evaluateMarkets } = require("../src/UniswapV2EthPair");
const { UNISWAP_FACTORY_ADDRESS, FACTORY_ADDRESSES, WETH_ADDRESS, BUNDLE_EXECUTOR_ADDRESS} = require("../src/addresses");
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

const minerRewardPercentage = 10;



//TODO: GOERLI test net integration... Need live flashbots relay to send bundled MEV tx
//refactor w/o flashbots for now
// const provider = new providers.StaticJsonRpcProvider(process.env.GOERLI);
// const provider = new providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET);
const provider = new providers.JsonRpcProvider();

const arbitrageSigningWallet = new Wallet(process.env.TEST_KEY); //private key of arbitrary wallet
// const arbitrageSigningWallet = new Wallet(process.env.PRIVATE_KEY);

const walletSigner = arbitrageSigningWallet.connect(provider)

// const FlashBotsUniswapQuery = artifacts.require('FlashBotsUniswapQuery');
const BundleExecutor = artifacts.require('FlashBotsMultiCall');

// const bundleContract = artifacts.require("FlashBotsMultiCall");
let query;
let groupedWethMarkets;
let instance;

const MARKET_ADDRESS = "0x0000000000000000000000000000000000000001"
const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000a"
const PROTOCOL_NAME = "TEST";


contract('Flash Swap Test', function() {


  beforeEach( async() => {

    const arbWalletBalance = await provider.getBalance(arbitrageSigningWallet.address);
    console.log(arbWalletBalance);

    console.log("Searcher wallet address: " + await arbitrageSigningWallet.getAddress());
    // console.log("Flashbots signing relay address: " + await flashbotsRelaySigningWallet.getAddress());


    instance = await BundleExecutor.deployed();


    groupedWethMarkets = [
      new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WETH_ADDRESS], PROTOCOL_NAME),
      new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WETH_ADDRESS], PROTOCOL_NAME),
    ]



  })

  it("take markets", async () => {
    const arbitrage = new Arbitrage(
      arbitrageSigningWallet,
      new Contract(instance.address, BUNDLE_EXECUTOR_ABI, walletSigner),
      provider
    )

    // const markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
    // wethPair = new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS,WETH_ADDRESS], PROTOCOL_NAME);
    // console.log(markets);
    // console.log('61');
    // await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
    // console.log('63');
    // const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken);
    // console.log(markets.marketsByToken);
    // console.log(bestCrossedMarkets);
    groupedWethMarkets[0].setReservesViaOrderedBalances([ETHER, ETHER.mul(2)])
    groupedWethMarkets[1].setReservesViaOrderedBalances([ETHER, ETHER])


    const bestCrossedMarket = getBestCrossedMarket([groupedWethMarkets], TOKEN_ADDRESS);

    const bestCrossedMarkets = [bestCrossedMarket]
    const balanceBefore = await provider.getBalance(arbitrageSigningWallet.address);
    // console.log(balanceBefore.toString());


    arbitrage.takeCrossedMarkets(bestCrossedMarkets, provider.getBlockNumber(), minerRewardPercentage);
    //TODO: Call WETH contract getBalance() method on arb executor contract
    const balanceAfter = await provider.getBalance(arbitrageSigningWallet.address);
    // console.log(balanceAfter.toString());
    const contractBalance = await provider.getBalance(instance.address);
    // console.log(contractBalance.toString());

    // expect(balanceAfter).to.be.gt(balanceAfter);



  });

});
