require('dotenv').config();

const {getBestCrossedMarket, UniswappyV2EthPair } = require("../src/UniswapV2EthPair");
const { WETH_ADDRESS } = require("../src/addresses");
const { BigNumber } = require("ethers");
const { ETHER } = require("../src/utils");


const { Contract } = require('@ethersproject/contracts');
const { ethers } = require('ethers');
const { MockProvider, solidity } = require('ethereum-waffle');
const chai = require('chai');
var expect = chai.expect;
chai.use(solidity);


const MARKET_ADDRESS = "0x0000000000000000000000000000000000000001"
const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000a"
const PROTOCOL_NAME = "TEST";

contract('Crossed markets test', async () =>{

  let groupedWethMarkets;
  beforeEach( () => {
    groupedWethMarkets = [
      new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WETH_ADDRESS], PROTOCOL_NAME),
      new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WETH_ADDRESS], PROTOCOL_NAME),
    ]
  })

  it('Calculate crossed markets', function () {
    groupedWethMarkets[0].setReservesViaOrderedBalances([ETHER, ETHER.mul(2)])
    groupedWethMarkets[1].setReservesViaOrderedBalances([ETHER, ETHER])


    const bestCrossedMarket = getBestCrossedMarket([groupedWethMarkets], TOKEN_ADDRESS);

    expect(bestCrossedMarket.volume).to.equal(BigNumber.from("208333333333333333"))
    expect(bestCrossedMarket.profit).to.equal(BigNumber.from("0x012be1d487a428ce"))
  })

  it('Calculate markets that do not cross', function() {
    groupedWethMarkets[0].setReservesViaOrderedBalances([ETHER,ETHER]);
    groupedWethMarkets[1].setReservesViaOrderedBalances([ETHER,ETHER]);

    const bestCrossedMarket = getBestCrossedMarket([groupedWethMarkets], TOKEN_ADDRESS);

    expect(bestCrossedMarket.profit).to.be.lt(0)
  })

});
