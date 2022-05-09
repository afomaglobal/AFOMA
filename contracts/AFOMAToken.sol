// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AFOMAToken is ERC20CappedUpgradeable {
    
    using SafeMath for uint256;
    
    // Calculating 1%
    // (amount * one_per) / max_bps
    uint64 constant private max_bps = 10_000;
    uint64 constant private one_per = 100;
    
    address private _foundation;

    /**
    * Minted as Capped tokens
    * 
    * Setting Token symbol, token supply and the foundation wallet address 
    */
    function initialize(uint256 cap, address foundation_) initializer public {
        __ERC20_init("AFOMAToken", "OMA");
        __ERC20Capped_init(cap);
        _mint(msg.sender, cap);
        _foundation = foundation_;
    }

    /**
    * Override Method
    *
    * Function to pay 1% fee to the foundation wallet on each transaction
    */
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        if (_foundation != to) {
            (bool mulOverFlow, uint256 result) = amount.tryMul(one_per);
            (bool divOverFlow, uint256 _taxAmount) = result.tryDiv(max_bps);
            require(mulOverFlow && divOverFlow, "Multiplication or Division overflow in contract _transfer function");
            super._transfer(from, _foundation, _taxAmount);
            (bool subOverFlow, uint256 _toBal) = amount.trySub(_taxAmount);
            require(subOverFlow, "Subraction overflow in contract _transfer function");
            amount = _toBal;
        }
        super._transfer(from, to, amount);
    }
}
