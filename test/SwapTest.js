require('dotenv').config();
const { Contract } = require('@ethersproject/contracts');
const { ethers } = require('ethers');
const { MockProvider } = require('ethereum-waffle');
const chai = require('chai');
var expect = chai.expect;


const FlashBot = artifacts.require('FlashBot');
const IWETH = artifacts.require('./contracts/interfaces/IWETH.sol');

contract('Flash Swap Test', async () => {
  const WETH = '0x0a180A76e4466bF68A7F86fB029BEd3cCcFaAac5';
  const DAI = '0xaD6D458402F60fD3Bd25163575031ACDce07538D';

  let iweth;

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  it("flash swap between Uniswap and Sushiswap", async () => {
    wethAbi = ['function deposit() external payable',
      'function transfer(address to, uint value) external returns (bool)',
      'function withdraw(uint) external'];

    const flashbot = await FlashBot.deployed();

    const uniFactoryAbi = ['function getPair(address tokenA, address tokenB) external view returns (address pair)'];
    const uniPairAbi = ['function sync()'];

    const uniswapV2FactoryAddr = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
    const uniswapFactory = new ethers.Contract(uniswapV2FactoryAddr, uniFactoryAbi, provider);

    const sushiV2FactoryAddr = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';
    const sushiswapFactory = new ethers.Contract(sushiV2FactoryAddr, uniFactoryAbi, provider);

    const [wallet, otherWallet] = new MockProvider().getWallets();

    // const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    let uniPairAddr = await uniswapFactory.getPair(WETH, DAI);
    console.log(uniPairAddr);
    let uniPair = new ethers.Contract(uniPairAddr, uniPairAbi, provider);
    /**TODO: fix - sushiswap getPair returns empty address.. may be a testnet address issue
        or need to check if pair exists, otherwise create pair...
    **/
    let sushiPairAddr = await sushiswapFactory.getPair(DAI, WETH);
    console.log(sushiPairAddr);

    const amntEth = ethers.utils.parseEther('100000');
    iweth = new ethers.Contract(WETH, wethAbi, wallet);
    await iweth.deposit({value: amntEth});
    await iweth.transfer(uniPairAddr, amntEth);
    await uniPair.connect(wallet).sync();

    const balanceBefore = await provider.getBalance(flashbot.address);
    await flashbot.flashArbitrage(uniPairAddr, sushiPairAddr);
    const balanceAfter = await provider.getBalance(flashbot.address);

    expect(balanceAfter).to.be.gt(balanceBefore);
  });

});
