
import { getActiveConfig, getAlgodClient } from "@tdea/algorand-utils";
import FaucetClient from "@tdea/faucet";
import algosdk from "algosdk";

async function getFaucetBalance(): Promise<string> {
    const ALGO_MNEMONIC = process.env.ALGO_MNEMONIC;
    if (!ALGO_MNEMONIC) {
        return "0.000000";
    }

    try {
        const algodClient = getAlgodClient();
        const faucetAccount = algosdk.mnemonicToSecretKey(ALGO_MNEMONIC);
        const accountInfo = await algodClient.accountInformation(faucetAccount.addr).do();
        const balance = accountInfo.amount;
        return (balance / 1_000_000).toFixed(6);
    } catch (error) {
        console.error("Failed to get faucet balance:", error);
        return "0.000000";
    }
}

async function getFaucetAddress(): Promise<string> {
    const ALGO_MNEMONIC = process.env.ALGO_MNEMONIC;
    if (!ALGO_MNEMONIC) {
        return "Dirección no disponible";
    }
    try {
        const faucetAccount = algosdk.mnemonicToSecretKey(ALGO_MNEMONIC);
        return faucetAccount.addr;
    } catch (error) {
        console.error("Failed to get faucet address:", error);
        return "Dirección no disponible";
    }
}


export default async function FaucetPage() {
    const faucetBalance = await getFaucetBalance();
    const faucetAddress = await getFaucetAddress();
    const activeConfig = getActiveConfig();

    return <FaucetClient faucetBalance={faucetBalance} explorerUrl={activeConfig.EXPLORER_URL} faucetAddress={faucetAddress} />;
}
