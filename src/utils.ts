import { BigNumber, Wallet } from "ethers";
import { EthMarket } from "./EthMarket";


export type MarketsByToken = { [tokenAddress: string]: Array<EthMarket> }


export const ETHER = BigNumber.from(10).pow(18);

export function bigNumberToDecimal(value: BigNumber, base = 18): number {
const divisor = BigNumber.from(10).pow(base)
return value.mul(10000).div(divisor).toNumber() / 10000
}


//used to sign FlashBot bundles - should not be actual trader wallet address
//this is an arbitary wallet to sign sequential transactions in bundle
export function getDefaultRelaySigningKey(): string {
console.warn("You have not specified an explicity FLASHBOTS_RELAY_SIGNING_KEY environment variable. Creating random signing key, this searcher will not be building a reputation for next run")
return Wallet.createRandom().privateKey;
}
