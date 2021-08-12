const FlashLoanV2 = artifacts.require("FlashloanV2");

module.exports = function (deployer) {
  deployer.deploy(FlashLoanV2, "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5" ); //AAVE lending pool address
};
