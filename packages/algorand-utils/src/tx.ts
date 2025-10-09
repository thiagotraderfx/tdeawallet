
"use server";

import algosdk from 'algosdk';
import { getAlgodClient, type Network } from './config';
import { logEvent } from './logger';
import { getUnlockedAccount } from './keystore';

const MIN_FEE_PER_TX = 1000;

// --- VALIDATORS ---

/**
 * Verifica si una cuenta ha hecho opt-in a un activo específico.
 * @param address La dirección a verificar.
 * @param assetId El ID del activo.
 * @param network La red en la que se verifica.
 * @returns `true` si la cuenta ha hecho opt-in, `false` en caso contrario.
 */
export async function isOptedIn(address: string, assetId: number, network: Network): Promise<boolean> {
    if (assetId === 0) return true; // ALGO no requiere opt-in
    const algod = getAlgodClient(network);
    try {
        const accountInfo = await algod.accountInformation(address).do();
        const assets = accountInfo['assets'] || [];
        const hasOptIn = assets.some((asset: any) => asset['asset-id'] === assetId);
        return hasOptIn;
    } catch (e: any) {
        if (e.response && e.response.status === 404) {
            return false;
        }
        console.error(`[isOptedIn] Unexpected error checking opt-in for ${address} on asset ${assetId}:`, e.message);
        throw new Error("Error al verificar el estado de opt-in del activo.");
    }
}


/**
 * Verifica si la cuenta tiene el saldo mínimo requerido para una transacción.
 * @param fromAddress La dirección del remitente.
 * @param amountToSend El monto a enviar en microAlgos (SOLO para transacciones de pago, para otras es 0).
 * @param fee La tarifa de la transacción en microAlgos.
 * @param network La red a la que conectarse.
 * @param extraMinBalanceReqt Requerimiento de saldo mínimo adicional (ej. para opt-in de ASA).
 * @returns `true` si el saldo es suficiente.
 */
export async function checkMinBalance(fromAddress: string, amountToSend: number, fee: number, network: Network, extraMinBalanceReqt: number = 0): Promise<boolean> {
    const algod = getAlgodClient(network);
    try {
        const accountInfo = await algod.accountInformation(fromAddress).do();
        const currentBalance = BigInt(accountInfo.amount);
        const newMinBalance = BigInt(accountInfo['min-balance']) + BigInt(extraMinBalanceReqt);
        const totalDebit = BigInt(amountToSend) + BigInt(fee);
        
        const balanceAfterTx = currentBalance - totalDebit;

        if (balanceAfterTx < newMinBalance) {
            logEvent('tx_failed', { reason: 'insufficient_balance', address: fromAddress, required: newMinBalance.toString(), availableAfterTx: balanceAfterTx.toString() });
            return false;
        }
        return true;
    } catch(e: any) {
        if (e.response && e.response.status === 404) {
            logEvent('tx_failed', { reason: 'account_does_not_exist', address: fromAddress });
            return false;
        }
        console.error("Error checking min balance:", e);
        return false;
    }
}


// --- SIGN & SEND ---
export async function signAndSendTransaction(fromAddress: string, txn: algosdk.Transaction, network: Network): Promise<{ txId: string }> {
    const account = getUnlockedAccount(fromAddress);
    const signedTxn = txn.signTxn(account.sk);
    
    const algod = getAlgodClient(network);
    try {
        const { txId } = await algod.sendRawTransaction([signedTxn]).do();
        logEvent('tx_sent', { type: txn.type?.toString(), assetId: txn.assetIndex, txId });
        return { txId };
    } catch (err: any) {
        throw err;
    }
}

export async function waitForConfirmation(txId: string, network: Network = 'TESTNET', timeout = 4) {
    const algod = getAlgodClient(network);
    try {
        const result = await algosdk.waitForConfirmation(algod, txId, timeout);
        logEvent('debug_tx_confirmed', { txId, confirmedRound: result['confirmed-round'] });
        return result;
    } catch (e: any) {
        logEvent('debug_tx_error', { reason: 'confirmation_timeout', txId, message: e.message });
        throw e;
    }
}
