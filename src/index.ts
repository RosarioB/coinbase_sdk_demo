import { Amount, Coinbase, Destination, readContract, Wallet } from "@coinbase/coinbase-sdk";
import fs from "fs";
import WETH_ABI from './abis/weth.json' with { type: 'json' };
import dotenv from "dotenv";
import { formatEther } from "viem";
dotenv.config();


const SEED_PATH = "mySeed.json";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

const createWallet = async () => {
  const wallet = await Wallet.create({
    networkId: Coinbase.networks.BaseSepolia,
  });
  wallet.saveSeed(SEED_PATH, true);
  console.log(
    `Seed for wallet ${wallet.getId()} successfully saved to ${SEED_PATH}`
  );
};

const loadWallet = async () => {
  const file = fs.readFileSync(SEED_PATH, "utf8");
  const json = JSON.parse(file);
  const walletId = Object.keys(json)[0];
  const wallet = await Wallet.fetch(walletId);
  await wallet.loadSeed(SEED_PATH);
  console.log(`Wallet ${wallet.getId()} successfully loaded from ${SEED_PATH}`);
  return wallet;
};

const fundWallet = async (wallet: Wallet, assetId: string) => {
  const tx = await wallet.faucet(assetId);
  await tx.wait();
  console.log(`Funded wallet ${wallet.getId()} with ${assetId}`);
};

const transferTokens = async (
  wallet: Wallet,
  amount: Amount,
  assetId: string,
  recipient: Destination
) => {
  const transfer = await wallet.createTransfer({
    amount: amount,
    assetId: assetId,
    destination: recipient,
  });

  await transfer.wait();

  if (transfer.getStatus() === "complete") {
    console.log(`Transfer successfully completed: `, transfer.toString());
  } else {
    console.error("Transfer failed on-chain: ", transfer.toString());
  }
};

const depositWeth = async (
  wallet: Wallet,
  amount: Amount,
) => {
    
    const contractInvocation = await wallet.invokeContract({
    contractAddress: WETH_ADDRESS,
    method: "deposit",
    abi: WETH_ABI,
    amount,
    assetId: Coinbase.assets.Eth,
    args: {},
  });
  
  const tx = await contractInvocation.wait();

  console.log(`Transaction executed: ${tx.getTransactionHash()}`);
};

const wethBalance = async(address: string) => {
    const balance = await readContract({
        networkId: "base-sepolia",
        contractAddress: WETH_ADDRESS as `0x${string}`,
        method: "balanceOf",
        args: { account: address },
        })as bigint;
        
        console.log(`The WETH balance of ${address} is ${formatEther(balance)}`);
}

async function main() {
  Coinbase.configure({
    apiKeyName: process.env.COINBASE_API_KEY_NAME!,
    privateKey: process.env.COINBASE_API_PRIVATE_KEY!,
  });
  //await createWallet();
  const wallet = await loadWallet();
  const defaultAddress = await wallet.getDefaultAddress();
  console.log(`Wallet address is ${defaultAddress}`);

  //await fundWallet(wallet, Coinbase.assets.Usdc);

  /* await transferTokens(
    wallet,
    0.001,
    Coinbase.assets.Eth,
    "0x20c6F9006d563240031A1388f4f25726029a6368"
  ); */

  //await depositWeth(wallet, 0.0001);

  //Balance
  /* const ethBalance = await wallet.getBalance(Coinbase.assets.Eth);
  console.log(`ETH balance is ${ethBalance}`); */
  /* const balances = await wallet.listBalances();
  console.log(balances); */

  await wethBalance("0x20c6F9006d563240031A1388f4f25726029a6368");
}
main();
