require('dotenv').config();

const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");
const {getBestCrossedMarket, UniswappyV2EthPair, evaluateMarkets } = require("../src/UniswapV2EthPair");
const { UNISWAP_FACTORY_ADDRESS, FACTORY_ADDRESSES, WETH_ADDRESS, BUNDLE_EXECUTOR_ADDRESS} = require("../src/addresses");
const { Arbitrage } = require("../src/Arbitrage");
const { get } = require("https");
const { getDefaultRelaySigningKey } = require("../src/utils");
const { BUNDLE_EXECUTOR_ABI } = require("../src/abi.ts");

const ethers = require("ethers");

const { BigNumber, Contract, providers, Wallet } = require("ethers");
const { ETHER } = require("../src/utils");
const { MockProvider, solidity } = require('ethereum-waffle');

const ganache = require("ganache-core");
const chai = require('chai');
var expect = chai.expect;
chai.use(solidity);

const minerRewardPercentage = 5;



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

const WETH_ABI = ["function deposit() public payable",
          // Some details about the token
        "function name() view returns (string)",
        "function symbol() view returns (string)",

        // Get the account balance
        "function balanceOf(address) view returns (uint)",

        // Send some of your tokens to someone else
        "function transfer(address to, uint amount)",

        "function approve(address guy, uint wad) public returns (bool)",

        // An event triggered whenever anyone transfers to someone else
        "event Transfer(address indexed from, address indexed to, uint amount)"
        ];

contract('Flash Swap Test', function() {


  beforeEach( async() => {

    // const arbWalletBalance = await provider.getBalance(arbitrageSigningWallet.address);
    // console.log(arbWalletBalance);

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

    groupedWethMarkets[0].setReservesViaOrderedBalances([ETHER, ETHER.mul(2)])
    groupedWethMarkets[1].setReservesViaOrderedBalances([ETHER, ETHER])

    // const markets = await UniswappyV2EthPair.getUniswappyMarketsByToken(provider, FACTORY_ADDRESSES)

    // await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs)

    // const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken)
    const bestCrossedMarket = getBestCrossedMarket([groupedWethMarkets], TOKEN_ADDRESS);
    // const balanceBefore = await provider.getBalance(arbitrageSigningWallet.address);
    const buyCalls = await bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(WETH_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket);
    const inter = bestCrossedMarket.buyFromMarket.getTokensOut(WETH_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume)
    const sellCallData = await bestCrossedMarket.sellToMarket.sellTokens(bestCrossedMarket.tokenAddress, inter, instance.address);

    const targets = [...buyCalls.targets, bestCrossedMarket.sellToMarket.marketAddress]
    const payloads = [...buyCalls.data, sellCallData]
    const profit = bestCrossedMarket.profit


    console.log("Profit:", profit.toString())
    const minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
    console.log(minerReward.toString())

    var amountToTransfer = bestCrossedMarket.volume.add(minerReward)
    console.log(amountToTransfer/1E18)

    amountToTransfer = amountToTransfer.add(ethers.utils.parseEther('1000'))
    console.log(amountToTransfer/1E18)

    const WETH = new Contract(WETH_ADDRESS, WETH_ABI, walletSigner);
    await WETH.deposit({value:amountToTransfer.toString()})
    await WETH.approve(instance.address, amountToTransfer.toString())
    await WETH.transfer(instance.address, amountToTransfer.toString())
    const contractWETHBal = await WETH.balanceOf(instance.address)
    console.log("Contract WETH bal before: ", contractWETHBal/1E18)

    const profitMinusMinerReward = profit.sub(minerReward)
    console.log("Send this much WETH", bestCrossedMarket.volume.toString(), "get this much profit after fees", profitMinusMinerReward.toString())



    const bundleExecute = new Contract(instance.address, BUNDLE_EXECUTOR_ABI, walletSigner)
    console.log({targets, payloads})

    await bundleExecute.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, {gasLimit: 600000});

    // arbitrage.takeCrossedMarkets(bestCrossedMarkets, provider.getBlockNumber(), minerRewardPercentage);
    const contractWETHBalAfter = await WETH.balanceOf(instance.address);
    console.log("Contract WETH bal after: ", contractWETHBalAfter/1E18)






  });

});
