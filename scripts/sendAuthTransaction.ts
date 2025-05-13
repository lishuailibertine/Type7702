import { ethers } from "hardhat";
import { LogicAccount } from "../typechain-types"; // 自动生成的类型
import { Address,createAddressFromString } from "@ethereumjs/util";
async function main() {
  // ✅ 你的合约地址
  const contractAddress = "0x163F94fcC8A1b9f01Efa22619cA3765178bC973e";

  // ✅ 获取合约工厂和 signer
  const [signer] = await ethers.getSigners();
  const Counter = await ethers.getContractFactory("LogicAccount");

  // ✅ 连接到已部署的合约
  const counter = Counter.attach(contractAddress).connect(signer) as LogicAccount;

  // ✅ 调用合约方法：读取 count
  const result = await counter.transferETH("0x306Bb8081C7dD356eA951795Ce4072e6e4bFdC32", 2n);

  console.log("result:", result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});