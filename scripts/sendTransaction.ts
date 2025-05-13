import { ethers } from "hardhat";
import * as rlp from "rlp";
import configs from "./../config/config";
import {
  createEOACode7702Tx,
  
} from "@ethereumjs/tx";
import { Mainnet, Hardfork,createCustomCommon} from "@ethereumjs/common";
import { hexToBytes, bigIntToHex, bigIntToBytes, bytesToHex, intToBytes, intToHex, createAddressFromString,
   EOACode7702AuthorizationListItemUnsigned,
   eoaCode7702SignAuthorization,
   eoaCode7702AuthorizationHashedMessageToSign} from "@ethereumjs/util";
async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = (await signer.provider.getNetwork()).chainId;
  const signerAddress = await signer.getAddress();
  const gasLimit = 200000n;
  const value = 0n;

  // 构造 calldata
  const iface = new ethers.Interface(["function doSomething(string)"]);

  // ---- 1. 构造授权 ----
  const logicAddress = "099d655aa43905617f7d4c42fd833bd77453c7db";
  const authAddress = "0x163F94fcC8A1b9f01Efa22619cA3765178bC973e"
  const zeroAddress = "0x0000000000000000000000000000000000000000"
  const authNonce = await signer.provider.getTransactionCount(
    authAddress, 'pending'
  );
  
  const unsignedJSONItem: EOACode7702AuthorizationListItemUnsigned = {
    chainId: bigIntToHex(chainId),
    address: `0x${logicAddress}`,
    nonce: intToHex(authNonce),
  }
  console.log("Unsigned JSON Item:", unsignedJSONItem);
  const signedFromBytes = eoaCode7702SignAuthorization(unsignedJSONItem, hexToBytes(`0x${configs.sepolia.accounts[1]}`));
  console.log("signedFromBytes: ",bytesToHex(signedFromBytes[0]) ,bytesToHex(signedFromBytes[1]) , bytesToHex(signedFromBytes[2]) , bytesToHex(signedFromBytes[3]) , bytesToHex(signedFromBytes[4]), bytesToHex(signedFromBytes[5]));
  const authorizationList = [signedFromBytes];

  // ---- 2. 构造交易结构 ----
  const txNonce = await signer.provider.getTransactionCount(
    await signer.getAddress()
  );
  console.log("txNonce: ", txNonce);
  const feeData = await signer.provider.getFeeData();
  console.log("feeData: ", bigIntToHex(feeData.maxFeePerGas!), bigIntToHex(feeData.maxPriorityFeePerGas!));
  const txData = {
    chainId: chainId,
    nonce: BigInt(txNonce),
    maxPriorityFeePerGas: BigInt(1000000),
    maxFeePerGas: BigInt(2500748),
    gasLimit,
    to: createAddressFromString(zeroAddress),
    value,
    authorizationList,
  };
  console.log("txData: ", txData);
  const commonWithCustomChainId = createCustomCommon({chainId: bigIntToHex(chainId)}, Mainnet, {
    eips: [7702],
    hardfork: Hardfork.Cancun,
  })
  const tx = createEOACode7702Tx(txData, {common: commonWithCustomChainId});
  console.log("raw: ", tx.raw());
  let txMessage = tx.getMessageToSign();
  console.log("txMessage: ", bytesToHex(txMessage));
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
