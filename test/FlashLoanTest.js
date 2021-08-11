const { UniswappyV2EthPair } = require("../src/UniswapV2EthPair");
const { WETH_ADDRESS, FLASHLOANER } = require("../src/addresses");
const { FLASHLOAN_ABI } = require("../src/abi");
const { BigNumber, Contract, providers, Wallet } = require("ethers");
const ethers = require("ethers");
const { ETHER } = require("../src/utils");

const { solidity } = require('ethereum-waffle');

const chai = require('chai');
var expect = chai.expect;
chai.use(solidity);

const provider = new providers.StaticJsonRpcProvider();
const flashLoaner = artifacts.require("FlashloanV2");
let instance;
let flashWallet;
contract('FlashLoan Test', function (){

  beforeEach( async () => {
    let accounts =  await provider.listAccounts();
    console.log(accounts);
    const WETH_ABI = ["function deposit() public payable",
              // Some details about the token
            "function name() view returns (string)",
            "function symbol() view returns (string)",

            // Get the account balance
            "function balanceOf(address) view returns (uint)",

            // Send some of your tokens to someone else
            "function transfer(address to, uint amount)",

            // An event triggered whenever anyone transfers to someone else
            "event Transfer(address indexed from, address indexed to, uint amount)"
            ];
    const flashWallet = new Wallet(process.env.TEST_KEY, provider);
    instance = await flashLoaner.deployed();
    const WETH = new Contract(WETH_ADDRESS, WETH_ABI, flashWallet);

    //trasnfer WETH to flashloan contract for testing - adding profitable
    // operations will not require this
    await WETH.deposit({value: ethers.utils.parseEther('10')});
    console.log("contract bal before: "+"(at address: "+instance.address+")");
    var contractBalBef = await WETH.balanceOf(instance.address);
    console.log(contractBalBef.toString());
    //Truffle decoder event emission bug occurs w/ transfer call
    //should catch and ignore this - tx is still sent to node and mined
    await WETH.transfer(instance.address, ethers.utils.parseEther('10'),{gasLimit: 6721975});
    console.log("contract bal after: ")
    var contractBalAft = await WETH.balanceOf(instance.address);
    console.log(contractBalAft.toString());

  })
  it('Flashloan call', async() => {
    instance.flashloan(WETH_ADDRESS,{"from":flashWallet});
  })


});
