const { UniswappyV2EthPair } = require("../src/UniswapV2EthPair");
const { WETH_ADDRESS } = require("../src/addresses");
const { BigNumber } = require("ethers");
const { ETHER } = require("../src/utils");

const { solidity } = require('ethereum-waffle');

const chai = require('chai');
var expect = chai.expect;
chai.use(solidity);

const MARKET_ADDRESS = "0x0000000000000000000000000000000000000001"
const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000a"
const PROTOCOL_NAME = "TEST";


contract("UniswapV2Pair", function () {

  let wethPair;
  beforeEach(() => {
    wethPair = new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS,WETH_ADDRESS], PROTOCOL_NAME);
    wethPair.setReservesViaOrderedBalances([ETHER, ETHER.mul(2)]);
  })

  it('feth balances by token address', function() {
    expect(wethPair.getBalance(TOKEN_ADDRESS)).to.equal(ETHER);
    expect(wethPair.getBalance(WETH_ADDRESS)).to.equal(ETHER.mul(2));
  })

  it('retrieve token input required for desired output', function() {
    expect(wethPair.getTokensIn(TOKEN_ADDRESS, WETH_ADDRESS, ETHER.div(10))).to.equal(BigNumber.from("52789948793749671"));
    expect(wethPair.getTokensIn(WETH_ADDRESS, TOKEN_ADDRESS, ETHER.div(10))).to.equal(BigNumber.from("222890894906943052"));
  })

  it('retrieve token output from given input', function() {
    expect(wethPair.getTokensOut(TOKEN_ADDRESS, WETH_ADDRESS, BigNumber.from("52789948793749671"))).to.equal(ETHER.div(10).add(1));
    expect(wethPair.getTokensOut(WETH_ADDRESS, TOKEN_ADDRESS, BigNumber.from("222890894906943052"))).to.equal(ETHER.div(10));
  })

});
