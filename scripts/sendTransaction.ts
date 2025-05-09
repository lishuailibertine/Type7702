import { ethers } from "hardhat";
import * as rlp from "rlp";
import configs from "./../config/config";
import {
  createEOACode7702Tx,
} from "@ethereumjs/tx";
import { Mainnet, Hardfork,createCustomCommon} from "@ethereumjs/common";
import { hexToBytes, bigIntToHex, bigIntToBytes, bytesToHex, intToBytes, createAddressFromString, EOACode7702AuthorizationListItem} from "@ethereumjs/util";
import { encodeRlp } from "ethers";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";
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
  const authNonce = await signer.provider.getTransactionCount(
    await signer.getAddress(), 'pending'
  );
  encodeRlp([bigIntToBytes(chainId), hexToBytes(`0x${logicAddress}`), intToBytes(authNonce)])
  const authMessage = rlp.encode([chainId, logicAddress, authNonce]);
  const msgHash = ethers.keccak256(
    Buffer.concat([Buffer.from("05", "hex"), authMessage])
  );
  const signature = secp256k1.sign(ethers.getBytes(msgHash), hexToBytes(`0x${configs.sepolia.accounts[0]}`));

  const auth: EOACode7702AuthorizationListItem = {
    chainId: bigIntToHex(chainId),
    address: `0x${logicAddress}`,
    nonce:
      bigIntToHex(BigInt(authNonce)) === "0x0"
        ? "0x"
        : bigIntToHex(BigInt(authNonce)),
    yParity: bigIntToHex(BigInt(signature.recovery)),
    r: bigIntToHex(signature.r),
    s: bigIntToHex(signature.s),
  };
  console.log("Authorization:", auth);
  const authorizationList = [auth];

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
    to: createAddressFromString(signer.address),
    value,
    accessList: [],
    authorizationList,
  };

  const commonWithCustomChainId = createCustomCommon({chainId: auth.chainId}, Mainnet, {
    eips: [7702],
    hardfork: Hardfork.Cancun,
  })
  const tx = createEOACode7702Tx(txData, {common: commonWithCustomChainId});
  const signedTx = tx.sign(hexToBytes((`0x${configs.sepolia.accounts[0]}`)));
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
