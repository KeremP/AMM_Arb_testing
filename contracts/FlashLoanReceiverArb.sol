/* "SPDX-License-Identifier: UNLICENSED" */
pragma solidity ^0.8.0;

import "./aave/FlashLoanReceiverBase.sol";
import "./aave/ILendingPoolAddressesProvider.sol";
import "./aave/ILendingPool.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import './UniswapV2Library.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Pair.sol';

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlashloanV2 is FlashLoanReceiverBase{

    using SafeMath for uint;


    constructor(address _addressProvider) FlashLoanReceiverBase(_addressProvider) {
    }


    /**
        This function is called after your contract has received the flash loaned amount
     */
    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    )
        external
        override
        returns (bool)
    {
        require(_amount <= getBalanceInternal(address(this), _reserve), "Invalid balance, was the flashLoan successful?");

        //
        // Your logic goes here.
        // !! Ensure that *this contract* has enough of `_reserve` funds to payback the `_fee` !!
        //

        uint totalDebt = _amount.add(_fee);
        transferFundsBackToPoolInternal(_reserve, totalDebt);
        return true;
    }

    /**
        Flash loan 1000000000000000000 wei (1 ether) worth of `_asset`
     */
    function flashloan(address _asset) public onlyOwner {
        bytes memory data = "";
        uint amount = 1 ether;

        ILendingPool lendingPool = ILendingPool(addressesProvider.getLendingPool());
        lendingPool.flashLoan(address(this), _asset, amount, data);
    }
}
