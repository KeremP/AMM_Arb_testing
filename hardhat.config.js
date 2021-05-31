/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY;
const RPCURL = process.env.RPC_URL;

require("@nomiclabs/hardhat-waffle");




task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  defaultNetwork: "infura",
  networks:{
    hardhat: {},
    infura: {
      url: RPCURL,
      accounts: [privateKey]
    }
  },
  solidity: "0.8.0",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
