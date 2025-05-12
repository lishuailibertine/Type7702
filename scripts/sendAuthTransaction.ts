import { ethers } from "hardhat";
import { LogicAccount } from "../typechain-types"; // 自动生成的类型
async function main() {
  // ✅ 你的合约地址
  const contractAddress = "0x163F94fcC8A1b9f01Efa22619cA3765178bC973e";

  // ✅ 获取合约工厂和 signer
  const [signer] = await ethers.getSigners();
  const Counter = await ethers.getContractFactory("LogicAccount");

  // ✅ 连接到已部署的合约
  const counter = Counter.attach(contractAddress).connect(signer) as LogicAccount;

  // ✅ 调用合约方法：读取 count
  const count = await counter.getCount();

  console.log("result:", count.toString(10));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});