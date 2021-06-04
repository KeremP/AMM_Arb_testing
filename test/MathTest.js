const InternalFuncTest = artifacts.require('InternalFuncTest');
const ethers = require('ethers');
const web3 = require('Web3');
const lodash = require('lodash');
const chai = require('chai');
var expect = chai.expect;
const {solidity} = require('ethereum-waffle');
chai.use(solidity);

contract('InternalFuncTest', async () =>{
  it('calculate square root correctly with small input', async () =>
    InternalFuncTest.deployed()
      .then(instance => instance._sqrt(ethers.BigNumber.from('100')))
      .then(res => {
        assert.equal(res, ethers.BigNumber.from(10).toNumber());

      })
    );

    it('calculate square root correctly with large input', async () =>
        InternalFuncTest.deployed()
          .then(instance => {

            const input = ethers.utils.parseEther('10000');
            const res = instance._sqrt(input);
            return res;

          })
          .then(res => {
            const expected = ethers.BigNumber.from('100000000000');
            assert.equal(res,expected.toNumber());
          })

      );

      it('calculate right solution for quadratic', async () =>
        InternalFuncTest.deployed()
          .then(instance => {
            const input_array = ['59995000000', '120100000000000', '59500000000000000'].map((v) => ethers.utils.parseEther(v));
            const res = instance._calcSolutionForQuadratic(input_array[0],input_array[1], input_array[2]);
            return res;
          })
          .then(res => {
            assert.equal(res[0],ethers.BigNumber.from('-900').toNumber());
            assert.equal(res[1],ethers.BigNumber.from('-1101').toNumber());
          })
      );

      it('calculate right solution for quadratic with negative number', async () =>
        InternalFuncTest.deployed()
          .then(instance => {
            const input_array = ['-10000000000', '2200000000000000', '-1000000000000000000'].map((v) => ethers.utils.parseEther(v));
            const res = instance._calcSolutionForQuadratic(input_array[0], input_array[1], input_array[2]);
            return res;
          })
          .then(res => {
            assert.equal(res[0],ethers.BigNumber.from('455').toNumber());
            assert.equal(res[1],ethers.BigNumber.from('219544').toNumber())
          })

        );

      it('returns right amount with small liquidity pairs', async () =>
        InternalFuncTest.deployed()
          .then(instance => {
            const reserves = { a1: '5000', b1: '10', a2: '6000', b2: '10' };
            const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
            const res = instance._calcBorrowAmount(input);
            return res;
          })
          .then(res => {
            expect(ethers.BigNumber.from(res.toString())).to.be.closeTo(ethers.utils.parseEther('0.45'), ethers.utils.parseEther('0.01'));
          })

      );

      it('returns right amount with large liquidity pairs', async () =>
        InternalFuncTest.deployed()
          .then(instance => {
            const reserves = { a1: '1200000000', b1: '600000', a2: '1000000000', b2: '300000' };
            const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
            const res = instance._calcBorrowAmount(input);
            return res;
          })
          .then(res => {
            expect(ethers.BigNumber.from(res.toString())).to.be.closeTo(ethers.utils.parseEther('53052.8604'), ethers.utils.parseEther('1500'));
          })

      );

      it('returns right amount with big difference between liquidity pairs', async () =>
        InternalFuncTest.deployed()
          .then(instance => {
            const reserves = { a1: '1200000000', b1: '600000', a2: '100000', b2: '30' };
            const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
            const res = instance._calcBorrowAmount(input);
            return res;
          })
          .then(res => {
            expect(ethers.BigNumber.from(res.toString())).to.be.closeTo(ethers.utils.parseEther('8.729'), ethers.utils.parseEther('0.01'));
          })
      );
      it('revert with wrong order input', async () =>
        InternalFuncTest.deployed()
          .then(instance => {
            const reserves = { a1: '1000000000', b1: '300000', a2: '1200000000', b2: '600000' };
            const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
            expect(instance._calcBorrowAmount(input)).to.be.revertedWith('Wrong input order');
          })
      );

    });
