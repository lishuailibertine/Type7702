import { ethers } from "hardhat";
import rlp from "rlp";
import {
  EOACodeEIP7702Transaction,
  AuthorizationListItem,
} from "@ethereumjs/tx";
import { Common } from "@ethereumjs/common";
import { hexToBytes, bigIntToHex, bytesToHex } from "@ethereumjs/util";

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
  const authNonce = await signer.provider.getTransactionCount(await signer.getAddress());
  const authMessage = rlp.encode([chainId, logicAddress, authNonce]);
  const msgHash = ethers.keccak256(
    Buffer.concat([Buffer.from("05", "hex"), authMessage])
  );
  const sig = await signer.signMessage(ethers.getBytes(msgHash));
  const { v, r, s } = ethers.Signature.from(sig);

  const auth: AuthorizationListItem = {
    chainId: bigIntToHex(chainId) ,
    address: logicAddress,
    nonce: [bigIntToHex(BigInt(authNonce)) === '0x0' ? '0x' : bigIntToHex(BigInt(authNonce))],
    yParity: bigIntToHex(BigInt(v % 2)),
    r: bigIntToHex(BigInt(r)),
    s: bigIntToHex(BigInt(s)),
  };

  const authorizationList = [auth];

  // ---- 2. 构造交易结构 ----
  const txNonce = await signer.provider.getTransactionCount(await signer.getAddress());
  const feeData = await signer.provider.getFeeData();

  const txData = {
    chainId: chainId,
    nonce: BigInt(txNonce),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 1n,
    maxFeePerGas: feeData.maxFeePerGas ?? 1n,
    gasLimit,
    to: signerAddress,
    value,
    data: data,
    accessList: [],
    authorizationList,
  };

  // 使用 EthereumJS 创建交易对象
  const common = Common.custom({ chainId });
  const tx = EOACodeEIP7702Transaction.fromTxData(txData, { common });

  console.log("EOACodeEIP7702Transaction Object:");
  console.log(tx);

  // 可选：签名交易
  const msgHashBuf = tx.getMessageToSign();
  const signature = await signer.signMessage(msgHashBuf);
  const { r: fr, s: fs, v: fv } = ethers.Signature.from(signature);

  const signedTx = tx.sign({ r: fr, s: fs, yParity: BigInt(fv % 2) });
  const rawTx = signedTx.serialize();

  console.log("Raw RLP tx:", "0x04" + rawTx.toString()); // 注意 0x04 是 type
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  