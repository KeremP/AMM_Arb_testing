const UniswapV2Query = artifacts.require("FlashBotsUniswapQuery");
const BundleExecutor = artifacts.require("FlashBotsMultiCall");

module.exports = function (deployer) {
  deployer.deploy(UniswapV2Query);
  deployer.deploy(BundleExecutor,"0x3C060ee624F9A7D10d21747FdA06e37a314CF548"); //change address on ganache fork
};
