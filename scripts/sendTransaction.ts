import {
  AuthorizationListItem,
  EOACodeEIP7702Transaction,
} from "@ethereumjs/tx";
import {
  bytesToHex,
  hexToBytes,
  type PrefixedHexString,
} from "@ethereumjs/util";
import { ethers } from "hardhat";


async function main() {
  const ContractFactory = await ethers.getContractFactory("LogicAccount");
  const contract = await ContractFactory.deploy();
  console.log("Deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
