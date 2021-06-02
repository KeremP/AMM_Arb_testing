const Migrations = artifacts.require("FlashBot");
const InternalFuncTest = artifacts.require('InternalFuncTest');

module.exports = function (deployer) {
  deployer.deploy(Migrations, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); //WETH contract address
  deployer.deploy(InternalFuncTest);
};
