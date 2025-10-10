// packages/faucet/src/lib/actions.ts.      

"use server";

import algosdk from "algosdk";
import { headers } from "next/headers";
// Eliminamos la importación de tipo 'next/dist...' que falló en la compilación.
import {
  FAUCET_AMOUNTS,
  ALGORAND_MIN_TX_FEE,
} from "./faucet-config";
import { FaucetFormSchema, type FaucetFormState } from "./schema";
// ELIMINADA: import { validateIpAddress } from "@/ai/flows/ip-address-validator";
import { buildClaimResult } from "./claim-utils";
import { getAlgodClient, getActiveConfig } from "@tdea/algorand-utils";

function getFaucetAccount(): algosdk.Account {
  const mnemonic = process.env.ALGO_MNEMONIC;

  if (!mnemonic) {
    console.error("CRITICAL ERROR: ALGO_MNEMONIC environment variable is not set.");
    throw new Error("Server configuration is incomplete. Cannot process payment.");
  }

  try {
    return algosdk.mnemonicToSecretKey(mnemonic);
  } catch (error) {
    console.error("CRITICAL ERROR: The ALGO_MNEMONIC is invalid.", error);
    throw new Error("Server configuration is invalid. Cannot initialize faucet account.");
  }
}

export async function claimAlgo(
  prevState: FaucetFormState,
  formData: FormData
): Promise<FaucetFormState> {
  const recipientAddressValue = formData.get("address");
  const requestId = crypto.randomUUID();
  console.info(`[claimAlgo][START]`, { requestId, to: recipientAddressValue, timestamp: new Date().toISOString() });

  try {
    const validatedFields = FaucetFormSchema.safeParse({
      address: recipientAddressValue,
    });

    if (!validatedFields.success) {
      const result = buildClaimResult({
        success: false,
        message: "Error: Dirección Algorand inválida.",
        code: "INVALID_ADDRESS",
        errors: validatedFields.error.flatten().fieldErrors,
      });
      console.info(`[claimAlgo][RETURN]`, { requestId, data: JSON.stringify(result) });
      return result;
    }

    const { address: recipientAddress } = validatedFields.data;
    
    // CORRECCIÓN APLICADA: Usamos 'as any' en el casting. Esto resuelve el conflicto de tipos
    // sin depender de rutas internas de Next.js que causaban el error de módulo no encontrado.
    const requestHeaders = headers() as any; 
    const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

    const algodClient = getAlgodClient();
    const faucetAccount = getFaucetAccount();

    // Bloque de validación de IP de Genkit ELIMINADO.
    // Antes:
    // const ipValidation = await validateIpAddress({ ipAddress: ip });
    // if (!ipValidation.isSafe) {
    //    ...
    // }

    const accountInfo = await algodClient.accountInformation(faucetAccount.addr).do();
    const balance = BigInt(accountInfo.amount);

    if (balance < BigInt(FAUCET_AMOUNTS.userRequest + ALGORAND_MIN_TX_FEE)) {
      console.error(`CRITICAL: Faucet has insufficient funds. Balance: ${balance}, Required: ${FAUCET_AMOUNTS.userRequest + ALGORAND_MIN_TX_FEE}`);
      const result = buildClaimResult({
        success: false,
        message: "Error: Faucet sin fondos disponibles, intente más tarde.",
        code: "INSUFFICIENT_FUNDS",
      });
       console.info(`[claimAlgo][RETURN]`, { requestId, data: JSON.stringify(result) });
      return result;
    }

    const suggestedParams = await algodClient.getTransactionParams().do();
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: faucetAccount.addr,
      to: recipientAddress,
      amount: FAUCET_AMOUNTS.userRequest,
      suggestedParams,
      note: new Uint8Array(Buffer.from("🌟 TdeA Faucet envía 1️⃣ ALGO ✅️ Utilízalo como quieras 🔑")),
    });

    const signedTxn = txn.signTxn(faucetAccount.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.info(`[claimAlgo][TX_SENT]`, { requestId, txId });

    const result = buildClaimResult({
      success: true,
      message: `¡Éxito! Transacción enviada.`,
      txId: txId,
      explorerUrl: getActiveConfig().EXPLORER_URL,
    });

    console.info(`[claimAlgo][RETURN]`, { requestId, data: JSON.stringify(result) });
    return result;

  } catch (error: any) {
    console.error("[claimAlgo][UNEXPECTED_ERROR]", { requestId, message: error.message, stack: error.stack });

    if (error.message.toLowerCase().includes("fetch")) {
      const result = buildClaimResult({
        success: false,
        message: "Error de red al conectar con el nodo de Algorand. Por favor, inténtalo más tarde.",
        code: "NETWORK_ERROR",
      });
      console.info(`[claimAlgo][RETURN]`, { requestId, data: JSON.stringify(result) });
      return result;
    }
    
    const result = buildClaimResult({
      success: false,
      message: "Ocurrió un error inesperado en el servidor. Por favor, inténtalo más tarde.",
      code: "UNEXPECTED_SERVER_ERROR",
    });
    console.info(`[claimAlgo][RETURN]`, { requestId, data: JSON.stringify(result) });
    return result;
  }
}
