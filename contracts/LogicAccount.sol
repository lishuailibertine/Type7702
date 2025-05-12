// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LogicAccount {
    uint256 public count;
    function increment() external {
        count += 1;
    }

    function setCount(uint256 newCount) external {
        count = newCount;
    }

    // 获取状态
    function getCount() external view returns (uint256) {
        return count;
    }
}
