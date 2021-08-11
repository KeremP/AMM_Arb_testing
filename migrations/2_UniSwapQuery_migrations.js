const UniswapV2Query = artifacts.require("FlashBotsUniswapQuery");
const BundleExecutor = artifacts.require("FlashBotsMultiCall");

module.exports = function (deployer) {
  deployer.deploy(UniswapV2Query);
  deployer.deploy(BundleExecutor,"0x8d15679CbFad6F936ED3b7B0D2e9d3b5BeabA25C");
};
