import { BigNumber, Wallet, providers } from "ethers";
const ethers = require('ethers');
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

export function send_token(contract_address: string, send_token_amount: string, to_address: string, send_account: string, private_key: string, provider: providers.Web3Provider)
{
    let wallet = new Wallet(private_key);
    let walletSigner = wallet.connect(provider);

    provider.getGasPrice().then((currentGasPrice) =>
    {
        let gas_price = ethers.utils.hexlify(parseInt(currentGasPrice.toString()));
        console.log(`gas_price: ${ gas_price }`);
          const tx =
          {
              from : send_account,
              to : to_address,
              value : ethers.utils.parseEther(send_token_amount),
              nonce : provider.getTransactionCount(send_account, 'latest'),
              gasLimit : ethers.utils.hexlify('0x100000'), // 100000
              gasPrice : gas_price
          }
          console.dir(tx);
          try{
              walletSigner.sendTransaction(tx).then((transaction) =>
              {
                  console.dir(transaction);
                  console.log('Send finished!');
              });
          }catch(error){
              console.log("failed to send!!");
          }

    });
}
