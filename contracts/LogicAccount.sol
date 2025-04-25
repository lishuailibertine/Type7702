// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LogicAccount {
    event Called(address sender, string message);

    function doSomething(string memory msgText) external {
        emit Called(msg.sender, msgText);
    }
}