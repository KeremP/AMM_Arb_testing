import * as _ from "lodash";
import { BigNumber, Contract, providers } from "ethers";
import { UNISWAP_PAIR_ABI, UNISWAP_QUERY_ABI } from "./abi";
import { UNISWAP_LOOKUP_CONTRACT_ADDRESS, WETH_ADDRESS } from "./addresses";
import { CallDetails, EthMarket, MultipleCallData, TokenBalances } from "./EthMarket";
import { ETHER, bigNumberToDecimal, MarketsByToken } from "./utils";

// batch count limit helpful for testing, loading entire set of uniswap markets takes a long time to load
const BATCH_COUNT_LIMIT = 1;
const UNISWAP_BATCH_SIZE = 500;

// Not necessary, slightly speeds up loading initialization when we know tokens are bad
// Estimate gas will ensure we aren't submitting bad bundles, but bad tokens waste time
const blacklistTokens = [
  '0xD75EA151a61d06868E31F8988D28DFE5E9df57B4'
]


interface GroupedMarkets {
  marketsByToken: MarketsByToken;
  allMarketPairs: Array<UniswappyV2EthPair>;
}

export class UniswappyV2EthPair extends EthMarket {
  static uniswapInterface = new Contract(WETH_ADDRESS, UNISWAP_PAIR_ABI);
  private _tokenBalances: TokenBalances

  constructor(marketAddress: string, tokens: Array<string>, protocol: string) {
    super(marketAddress, tokens, protocol);
    this._tokenBalances = _.zipObject(tokens,[BigNumber.from(0), BigNumber.from(0)])
  }

  receiveDirectly(tokenAddress: string): boolean {
    return tokenAddress in this._tokenBalances
  }

  async prepareReceive(tokenAddress: string, amountIn: BigNumber): Promise<Array<CallDetails>> {
    if (this._tokenBalances[tokenAddress] === undefined) {
      throw new Error(`Market does not operate on token ${tokenAddress}`)
    }
    if (! amountIn.gt(0)) {
      throw new Error(`Invalid amount: ${amountIn.toString()}`)
    }
    // No preparation necessary
    return []
  }

  static async getUniswappyMarkets(provider: providers.JsonRpcProvider, factoryAddress: string): Promise<Array<UniswappyV2EthPair>> {
    const uniswapQuery = new Contract(UNISWAP_LOOKUP_CONTRACT_ADDRESS, UNISWAP_QUERY_ABI, provider);

    const marketPairs = new Array<UniswappyV2EthPair>()
    for (let i = 0; i < BATCH_COUNT_LIMIT * UNISWAP_BATCH_SIZE; i += UNISWAP_BATCH_SIZE) {
      console.log("Batch count: ", i)
      const pairs: Array<Array<string>> = (await uniswapQuery.functions.getPairsByIndexRange(factoryAddress, i, i + UNISWAP_BATCH_SIZE))[0];
      for (let i = 0; i < pairs.length; i++) {
        console.log(pairs[i]);
        const pair = pairs[i];
        const marketAddress = pair[2];
        let tokenAddress: string;
        const uniswappyV2EthPair = new UniswappyV2EthPair(marketAddress, [pair[0], pair[1]], "");


        marketPairs.push(uniswappyV2EthPair);

      }
      if (pairs.length < UNISWAP_BATCH_SIZE) {
        break
      }
      if (marketPairs.length > 2 ){
        break
      }
    }
    // console.log(marketPairs);
    return marketPairs
  }

  static async getUniswapMarketsByToken(provider: providers.JsonRpcProvider, factoryAddresses: Array<string>): Promise<GroupedMarkets> {
    const allPairs = await Promise.all(
      _.map(factoryAddresses, factoryAddress => UniswappyV2EthPair.getUniswappyMarkets(provider, factoryAddress))
    )

    const marketsByTokenAll = _.chain(allPairs)
      .flatten()
      .groupBy(pair => pair.tokens[0] === WETH_ADDRESS ? pair.tokens[1] : pair.tokens[0])
      .value()

    const allMarketPairs = _.chain(
      _.pickBy(marketsByTokenAll, a => a.length > 1) // weird TS bug, chain'd pickBy is Partial<>
    )
      .values()
      .flatten()
      .value()

    await UniswappyV2EthPair.updateReserves(provider, allMarketPairs);
    // console.log(allMarketPairs);
    for(let i = 0; i<10;i++){
        console.log(allMarketPairs[i].getBalance(WETH_ADDRESS));
    }
    const marketsByToken = _.chain(allMarketPairs)
      .filter(pair => (pair.getBalance(WETH_ADDRESS).gt(ETHER)))
      .groupBy(pair => pair.tokens[0] === WETH_ADDRESS ? pair.tokens[1] : pair.tokens[0])
      .value()

    return {
      marketsByToken,
      allMarketPairs
    }
  }

  static async updateReserves(provider: providers.JsonRpcProvider, allMarketPairs: Array<UniswappyV2EthPair>): Promise<void> {
    const uniswapQuery = new Contract(UNISWAP_LOOKUP_CONTRACT_ADDRESS, UNISWAP_QUERY_ABI, provider);
    const pairAddresses = allMarketPairs.map(marketPair => marketPair.marketAddress);
    console.log("Updating markets, count:", pairAddresses.length)
    const reserves: Array<Array<BigNumber>> = (await uniswapQuery.functions.getReservesByPairs(pairAddresses))[0];
    for (let i = 0; i < allMarketPairs.length; i++) {
      const marketPair = allMarketPairs[i];
      const reserve = reserves[i]
      marketPair.setReservesViaOrderedBalances([reserve[0], reserve[1]])
    }
  }

  getBalance(tokenAddress: string): BigNumber {
    const balance = this._tokenBalances[tokenAddress]
    if (balance === undefined) return BigNumber.from("0");
    return balance;
  }

  setReservesViaOrderedBalances(balances: Array<BigNumber>): void {
    this.setReservesViaMatchingArray(this._tokens, balances)
  }

  setReservesViaMatchingArray(tokens: Array<string>, balances: Array<BigNumber>): void {
    const tokenBalances = _.zipObject(tokens, balances)
    if (!_.isEqual(this._tokenBalances, tokenBalances)) {
      this._tokenBalances = tokenBalances
    }
  }

  getTokensIn(tokenIn: string, tokenOut: string, amountOut: BigNumber): BigNumber {
    const reserveIn = this._tokenBalances[tokenIn]
    const reserveOut = this._tokenBalances[tokenOut]
    return this.getAmountIn(reserveIn, reserveOut, amountOut);
  }

  getTokensOut(tokenIn: string, tokenOut: string, amountIn: BigNumber): BigNumber {
    const reserveIn = this._tokenBalances[tokenIn]
    const reserveOut = this._tokenBalances[tokenOut]
    return this.getAmountOut(reserveIn, reserveOut, amountIn);
  }

  getAmountIn(reserveIn: BigNumber, reserveOut: BigNumber, amountOut: BigNumber): BigNumber {
    const numerator: BigNumber = reserveIn.mul(amountOut).mul(1000);
    const denominator: BigNumber = reserveOut.sub(amountOut).mul(997);
    return numerator.div(denominator).add(1);
  }

  getAmountOut(reserveIn: BigNumber, reserveOut: BigNumber, amountIn: BigNumber): BigNumber {
    const amountInWithFee: BigNumber = amountIn.mul(997);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(1000).add(amountInWithFee);
    return numerator.div(denominator);
  }

  async sellTokensToNextMarket(tokenIn: string, amountIn: BigNumber, ethMarket: EthMarket): Promise<MultipleCallData> {
    if (ethMarket.receiveDirectly(tokenIn) === true) {
      const exchangeCall = await this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress)
      return {
        data: [exchangeCall],
        targets: [this.marketAddress]
      }
    }

    const exchangeCall = await this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress)
    return {
      data: [exchangeCall],
      targets: [this.marketAddress]
    }
  }

  async sellTokens(tokenIn: string, amountIn: BigNumber, recipient: string): Promise<string> {
    // function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external lock {
    let amount0Out = BigNumber.from(0)
    let amount1Out = BigNumber.from(0)
    let tokenOut: string;
    if (tokenIn === this.tokens[0]) {
      tokenOut = this.tokens[1]
      amount1Out = this.getTokensOut(tokenIn, tokenOut, amountIn)
    } else if (tokenIn === this.tokens[1]) {
      tokenOut = this.tokens[0]
      amount0Out = this.getTokensOut(tokenIn, tokenOut, amountIn)
    } else {
      throw new Error("Bad token input address")
    }
    const populatedTransaction = await UniswappyV2EthPair.uniswapInterface.populateTransaction.swap(amount0Out, amount1Out, recipient, []);
    if (populatedTransaction === undefined || populatedTransaction.data === undefined) throw new Error("HI")
    return populatedTransaction.data;
  }
}

export interface CrossedMarketDetails {
profit: BigNumber,
volume: BigNumber,
tokenAddress: string,
buyFromMarket: EthMarket,
sellToMarket: EthMarket,
}

// export type MarketsByToken = { [tokenAddress: string]: Array<EthMarket> }

// TODO: implement binary search (assuming linear/exponential global maximum profitability)
const TEST_VOLUMES = [
ETHER.div(100),
ETHER.div(10),
ETHER.div(6),
ETHER.div(4),
ETHER.div(2),
ETHER.div(1),
ETHER.mul(2),
ETHER.mul(5),
ETHER.mul(10),
]

export function getBestCrossedMarket(crossedMarkets: Array<EthMarket>[], tokenAddress: string): CrossedMarketDetails | undefined {
let bestCrossedMarket: CrossedMarketDetails | undefined = undefined;
for (const crossedMarket of crossedMarkets) {
  const sellToMarket = crossedMarket[0]
  const buyFromMarket = crossedMarket[1]
  for (const size of TEST_VOLUMES) {
    const tokensOutFromBuyingSize = buyFromMarket.getTokensOut(WETH_ADDRESS, tokenAddress, size);
    const proceedsFromSellingTokens = sellToMarket.getTokensOut(tokenAddress, WETH_ADDRESS, tokensOutFromBuyingSize)
    const profit = proceedsFromSellingTokens.sub(size);
    if (bestCrossedMarket !== undefined && profit.lt(bestCrossedMarket.profit)) {
      // If the next size up lost value, meet halfway. TODO: replace with real binary search
      const trySize = size.add(bestCrossedMarket.volume).div(2)
      const tryTokensOutFromBuyingSize = buyFromMarket.getTokensOut(WETH_ADDRESS, tokenAddress, trySize);
      const tryProceedsFromSellingTokens = sellToMarket.getTokensOut(tokenAddress, WETH_ADDRESS, tryTokensOutFromBuyingSize)
      const tryProfit = tryProceedsFromSellingTokens.sub(trySize);
      if (tryProfit.gt(bestCrossedMarket.profit)) {
        bestCrossedMarket = {
          volume: trySize,
          profit: tryProfit,
          tokenAddress,
          sellToMarket,
          buyFromMarket
        }
      }
      break;
    }
    bestCrossedMarket = {
      volume: size,
      profit: profit,
      tokenAddress,
      sellToMarket,
      buyFromMarket
    }
  }
}
return bestCrossedMarket;
}

export async function evaluateMarkets(marketsByToken: MarketsByToken): Promise<Array<CrossedMarketDetails>> {
  const bestCrossedMarkets = new Array<CrossedMarketDetails>()

  for (const tokenAddress in marketsByToken) {
    const markets = marketsByToken[tokenAddress]
    const pricedMarkets = _.map(markets, (ethMarket: EthMarket) => {
      return {
        ethMarket: ethMarket,
        buyTokenPrice: ethMarket.getTokensIn(tokenAddress, WETH_ADDRESS, ETHER.div(100)),
        sellTokenPrice: ethMarket.getTokensOut(WETH_ADDRESS, tokenAddress, ETHER.div(100)),
      }
    });

    const crossedMarkets = new Array<Array<EthMarket>>()
    for (const pricedMarket of pricedMarkets) {
      _.forEach(pricedMarkets, pm => {
        if (pm.sellTokenPrice.gt(pricedMarket.buyTokenPrice)) {
          crossedMarkets.push([pricedMarket.ethMarket, pm.ethMarket])
        }
      })
    }

    const bestCrossedMarket = getBestCrossedMarket(crossedMarkets, tokenAddress);
    if (bestCrossedMarket !== undefined && bestCrossedMarket.profit.gt(ETHER.div(1000))) {
      bestCrossedMarkets.push(bestCrossedMarket)
    }
  }
  bestCrossedMarkets.sort((a, b) => a.profit.lt(b.profit) ? 1 : a.profit.gt(b.profit) ? -1 : 0)
  return bestCrossedMarkets
}
