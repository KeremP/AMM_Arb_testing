const UniswapV2Query = artifacts.require("FlashBotsUniswapQuery");
const BundleExecutor = artifacts.require("FlashBotsMultiCall");

module.exports = function (deployer) {
  deployer.deploy(UniswapV2Query);
  deployer.deploy(BundleExecutor,"0x392d7E9C450Ba6c1543c3C4588dC692B1340CEDc");
};
