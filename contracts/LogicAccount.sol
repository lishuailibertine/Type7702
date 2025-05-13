// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LogicAccount {
    uint256 public count;
    function increment() public {
        count += 1;
    }
    receive() external payable {}

    function setCount(uint256 newCount) public {
        count = newCount;
    }

    // 获取状态
    function getCount() public view returns (uint256) {
        return count;
    }

    function transferETH(address payable to, uint256 amount) public {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
    }
}
