import { ethers } from "hardhat";
import * as rlp from "rlp";
import configs from "./../config/config";
import {
  createEOACode7702Tx,
} from "@ethereumjs/tx";
import { Mainnet, Hardfork,createCustomCommon} from "@ethereumjs/common";
import { hexToBytes, bigIntToHex, bigIntToBytes, bytesToHex, intToBytes, intToHex, createAddressFromString,
   EOACode7702AuthorizationListItemUnsigned,
   eoaCode7702SignAuthorization} from "@ethereumjs/util";
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
  const logicAddress = "0b6cf3840d0e8db89bd4088d55a612361983f11d";
  const authAddress = "0x624200b0E180495fb97320AA7d9fC8646B5f1B28"
  const zeroAddress = "0000000000000000000000000000000000000000"
  const authNonce = await signer.provider.getTransactionCount(
    authAddress, 'pending'
  );
  
  const unsignedJSONItem: EOACode7702AuthorizationListItemUnsigned = {
    chainId: bigIntToHex(chainId),
    address: `0x${zeroAddress}`,
    nonce: intToHex(authNonce),
  }
  const signedFromBytes = eoaCode7702SignAuthorization(unsignedJSONItem, hexToBytes(`0x${configs.sepolia.accounts[1]}`));
 
  console.log("Authorization:", signedFromBytes);
  const authorizationList = [signedFromBytes];

  // ---- 2. 构造交易结构 ----
  const txNonce = await signer.provider.getTransactionCount(
    await signer.getAddress()
  );
  
  const feeData = await signer.provider.getFeeData();

  const txData = {
    chainId: chainId,
    nonce: BigInt(txNonce),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 1n,
    maxFeePerGas: feeData.maxFeePerGas ?? 1n,
    gasLimit,
    to: createAddressFromString(authAddress),
    value,
    authorizationList,
  };

  const commonWithCustomChainId = createCustomCommon({chainId: bigIntToHex(chainId)}, Mainnet, {
    eips: [7702],
    hardfork: Hardfork.Cancun,
  })
  const tx = createEOACode7702Tx(txData, {common: commonWithCustomChainId});
  const signedTx = tx.sign(hexToBytes((`0x${configs.sepolia.accounts[0]}`)));
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
