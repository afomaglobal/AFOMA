require("dotenv").config();

const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { constants, expectRevert } = require('@openzeppelin/test-helpers');

describe("AFOMAToken", async () => {
  const name = "AFOMAToken";
  const symbol = "OMA";
  
  const { ZERO_ADDRESS } = constants;
  const initialSupply = process.env.INITAL_SUPPLY;
  
  let afomaToken;
  let foundationAddress;
  let owner, spender, addr1, addr2, addr3, addr4;
  let transferAmount, transferAmountFee, receipientBalance;

  before(async () => {
    [owner, spender, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    foundationAddress = addr1.address;
    
    const AfomaToken = await ethers.getContractFactory("AFOMAToken");
    afomaToken = await upgrades.deployProxy(AfomaToken, [initialSupply, foundationAddress]);
    
    transferAmount = ethers.utils.parseEther("30");
    transferAmountFee = ethers.utils.parseEther("0.3");
    receipientBalance = ethers.utils.parseEther("29.7");
  });

  it('has a name', async () => {
    expect(await afomaToken.name()).to.equal(name);
  });

  it('has a symbol', async () => {
    expect(await afomaToken.symbol()).to.equal(symbol);
  });

  it('has 18 decimals', async () => {
    expect(await afomaToken.decimals()).to.equal(18);
  });

  describe('totalSupply', () => {
    it('check total supply is equal to owner balance', async () => {
      expect(await afomaToken.totalSupply()).to.equal(initialSupply);
    });
  });

  describe('Pay Tax', () => {
    it('should transfer 1% of token to foundational address', async () => {
      await (await afomaToken.transfer(addr2.address, transferAmount)).wait();
      const foundationBalance = await afomaToken.balanceOf(foundationAddress);
      expect(foundationBalance).to.equal(transferAmountFee);
    });
  });

  describe('_transfer', () => {
    describe('when the receiver receives the tokens', () => {
      it('should update receiver balance', async () => {
        await (await afomaToken.transfer(addr3.address, transferAmount)).wait();
        expect(await afomaToken.balanceOf(addr3.address)).to.equal(receipientBalance);
      });
    });

    describe('when receiver address is zero', () => {
      it('reverts', async () => {
        await expectRevert(
          afomaToken.transfer(ZERO_ADDRESS, transferAmount), 
          "ERC20: transfer to the zero address"
        )
      });
    });

    describe('when sender has insufficient balance to transfer', () => {
      it('reverts', async () => {
        await expectRevert(
          afomaToken.connect(addr4).transfer(addr2.address, transferAmount), 
          "ERC20: transfer amount exceeds balance"
        )
      });
    });
  });

  describe('Balance', () => {
    it('Returns balance of given address', async () => {
      expect(await afomaToken.balanceOf(addr3.address)).to.equal(receipientBalance);
    });
  });

  describe('allowance', () => {

    let allowance;
    before(() => {
      allowance = ethers.utils.parseEther("30");
    })

    describe('when there was no approved amount before decrease allowance', () => {
      it('reverts', async () => {
        await expectRevert(afomaToken.decreaseAllowance(
          spender.address, allowance), 'ERC20: decreased allowance below zero',
        );
      });
    });

    describe('when increase allowance for an address', () => { 
      it('should increase allowance', async () => {
        await (
          await afomaToken.increaseAllowance(spender.address, allowance)
        ).wait();
        expect(await afomaToken.allowance(owner.address, spender.address)).to.equal(allowance);
      });
    });

    describe('when decrease allowance for an address', () => { 
      it('should decrease allowance', async () => {
        const allowance = ethers.utils.parseEther("20");
        const decreasedAllowance = ethers.utils.parseEther("10");
        await (
          await afomaToken.decreaseAllowance(spender.address, allowance)
        ).wait();
        expect(await afomaToken.allowance(owner.address, spender.address)).to.equal(decreasedAllowance);
      });
    });

    describe('when decrease allowance for a zero address', () => { 
      it('reverts', async () => {
        await expectRevert(
          afomaToken.decreaseAllowance(ZERO_ADDRESS, allowance), 
          "ERC20: decreased allowance below zero"
        );
      });
    });

    describe('when increase allowance for a zero address', () => { 
      it('reverts', async () => {
        await expectRevert(
          afomaToken.increaseAllowance(ZERO_ADDRESS, allowance), 
          "ERC20: approve to the zero address"
        );
      })
    });
  });
});
