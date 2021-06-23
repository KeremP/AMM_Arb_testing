const UniswapV2Query = artifacts.require("FlashBotsUniswapQuery");
const BundleExecutor = artifacts.require("FlashBotsMultiCall");

module.exports = function (deployer) {
  deployer.deploy(UniswapV2Query);
  deployer.deploy(BundleExecutor,"0xecCCe2e0FdB930EC4B57e0FBE3b8749F4afa2665"); //change address on ganache fork
};
