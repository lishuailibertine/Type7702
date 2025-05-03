import { ethers } from "hardhat";
import * as rlp from "rlp";
import configs from "./../config/config";
import {
  createEOACode7702Tx,
  AuthorizationListItem,
} from "@ethereumjs/tx";
import { Sepolia, Hardfork,createCustomCommon } from "@ethereumjs/common";
import { hexToBytes, bigIntToHex, bytesToHex, Address, ecsign} from "@ethereumjs/util";
import { getBytes } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = (await signer.provider.getNetwork()).chainId;
  const signerAddress = await signer.getAddress();
  const gasLimit = 200000n;
  const value = 0n;

  // 构造 calldata
  const iface = new ethers.Interface(["function doSomething(string)"]);
  const data = iface.encodeFunctionData("doSomething", ["hello 7702"]);

  // ---- 1. 构造授权 ----
  const logicAddress = "0x0b6cf3840d0e8db89bd4088d55a612361983f11d";
  const authNonce = await signer.provider.getTransactionCount(
    await signer.getAddress(), 'pending'
  );
  const authMessage = rlp.encode([chainId, logicAddress, authNonce]);
  const msgHash = ethers.keccak256(
    Buffer.concat([Buffer.from("05", "hex"), authMessage])
  );
  const signature = ecsign(ethers.getBytes(msgHash), hexToBytes(configs.sepolia.accounts[0]));

  const auth: AuthorizationListItem = {
    chainId: bigIntToHex(chainId),
    address: logicAddress,
    nonce:
      bigIntToHex(BigInt(authNonce)) === "0x0"
        ? "0x"
        : bigIntToHex(BigInt(authNonce)),
    yParity:bigIntToHex(signature.v - BigInt(27)) === '0x0' ? '0x' : '0x1',
    r: bytesToHex(signature.r),
    s: bytesToHex(signature.s),
  };

  const authorizationList = [auth];

  // ---- 2. 构造交易结构 ----
  const txNonce = 176;
  
  const feeData = await signer.provider.getFeeData();

  const txData = {
    chainId: chainId,
    nonce: BigInt(txNonce),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 1n,
    maxFeePerGas: feeData.maxFeePerGas ?? 1n,
    gasLimit,
    to: Address.fromString(logicAddress),
    value,
    data: getBytes(data),
    accessList: [],
    authorizationList,
  };

  const commonWithCustomChainId = createCustomCommon({chainId: auth.chainId}, Sepolia, {
    eips: [7702],
    hardfork: Hardfork.Cancun,
  })
  const tx = createEOACode7702Tx(txData, {common: commonWithCustomChainId});
  const signedTx = tx.sign(hexToBytes(configs.sepolia.accounts[0]));
  console.log(signedTx);
  const rawTx = signedTx.serialize();
  console.log("Raw RLP tx:", bytesToHex(rawTx));
  // https://sepolia.etherscan.io/tx/0x5ad6f51a8b665549a68303d988409399e33411c4e02241da9f5f7e9e0ed36c18
  // const txHash = await signer.provider.broadcastTransaction(bytesToHex(rawTx));
  // console.log("Transaction hash:", txHash);
}

main().catch((error) => {
  console.error("Transaction Error:", error);
  process.exitCode = 1;
});
