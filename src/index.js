require('dotenv').config();
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");
const { Contract, providers, Wallet} = require("ethers");
const { BUNDLE_EXECUTOR_ABI } = require("./abi.ts");
const { UniswappyV2EthPair } = require("./UniswapV2EthPair.ts");
const { FACTORY_ADDRESSES } = require("./addresses.ts");
const { Arbitrage } = require("./Arbitrage");
const { get } = require("https");
const { getDefaultRelaySigningKey } = require("./utils");

const ETHERUM_RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BUNDLE_EXECUTOR_ADDRESS = "";
const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || getDefaultRelaySigningKey();

const MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "80");

const provider = new proivders.StaticJsonRpcProvider(ETHERUM_RPC_URL);
//Test provider:
// const provider = providers.getDefaultProvider('goerli');

const arbitrageSigningWallet = new Wallet(PRIVATE_KEY, provider);
const flashbotsRelaySigningWallet = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY);


async function main() {
  console.log("Searcher wallet address: " + await arbitrageSigningWallet.getAddress());
  console.log("Flashbots signing relay address: " + await flashbotsRelaySigningWallet.getAddress());

  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
  const arbitrage = new Arbitrage(
    arbitrageSigningWallet,
    flashbotsProvider,
    new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, provider)
  );

  const markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);

  provider.on('block', async (blockNumber) => {
    await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
    const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken);
    if (bestCrossMarkets.length === 0){
      console.log("No crossed markets");
      return
    }

    bestCrossMarkets.forEach(arbitrage.printCrossedMarket);
    arbitrage.takeCrossedMarkets(bestCrossMarkets, blockNumber, MINER_REWARD_PERCENTAGE).catch(console.error);
  });


}

main();
