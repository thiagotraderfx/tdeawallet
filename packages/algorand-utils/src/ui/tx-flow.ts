
"use server";

import algosdk from 'algosdk';
import { getAlgodClient, type Network, getActiveConfig } from '../config';
import { checkMinBalance, isOptedIn } from '../tx';
import type { SendPayload, TxPreview, TxPreviewData, TransactionInfo } from '../types/tx';
import { TransactionType } from '../types/tx';
import { microalgosToAlgos } from '../utils';
import { classifyAsset } from '../assets/classifier';
import { logEvent } from '../logger';
import { parseUserAmountToBaseUnits } from '../amounts';

const MIN_FEE_PER_TX = 1000;

type PreviewResult = { ok: true; preview: TxPreview } | { ok: false; error: string; message: string };
type OptInPreviewResult = { ok: true; preview: TxPreview } | { ok: false; error: string; message: string };


export async function buildDisplayInfo(payload: SendPayload, network: Network = getActiveConfig().CHAIN_ID === 'mainnet-v1.0' ? 'MAINNET' : 'TESTNET'): Promise<TxPreview> {
    const algod = getAlgodClient(network);
    const sp = await algod.getTransactionParams().do();
    const feeMicroAlgos = Math.max(sp.fee, MIN_FEE_PER_TX);
    
    const classifiedAsset = payload.assetId !== 0 ? await classifyAsset(payload.assetId, network) : null;
    const decimals = classifiedAsset?.decimals ?? 6;
    const amountInBaseUnits = parseUserAmountToBaseUnits(payload.amount, decimals);

    const txData: TxPreviewData = {
        type: payload.assetId === 0 ? 'pay' : (classifiedAsset?.type === 'NFT' ? 'nft' : 'axfer'),
        from: payload.from,
        to: payload.to,
        assetId: payload.assetId,
        amount: amountInBaseUnits.toString(),
        assetDecimals: decimals,
        feeMicroAlgos: feeMicroAlgos,
        firstRound: sp.firstRound,
        lastRound: sp.lastRound,
        genesisID: sp.genesisID,
        genesisHash: sp.genesisHash,
        noteBase64: payload.note ? Buffer.from(payload.note).toString('base64') : undefined,
    };
    
    const displayInfo: TransactionInfo = {
        type: payload.assetId === 0 ? TransactionType.Payment : (classifiedAsset?.type === 'NFT' ? TransactionType.NFTTransfer : TransactionType.AssetTransfer),
        from: payload.from, 
        to: payload.to, 
        amount: payload.amount, // Mantener el input del usuario para display
        fee: microalgosToAlgos(feeMicroAlgos),
        assetId: payload.assetId,
        assetName: classifiedAsset?.name,
        assetUnit: classifiedAsset?.unitName,
        assetImageUrl: classifiedAsset?.imageUrl || undefined,
        assetStandard: classifiedAsset?.standard,
        note: payload.note,
    };

     return { displayInfo, txData };
}


/**
 * Prepara y valida una transacción de envío, devolviendo una vista previa como POJO.
 * Esta función es el corazón de la lógica de negocio antes de la firma.
 * @param payload Los datos de la transacción introducidos por el usuario.
 * @returns Una promesa que se resuelve con un objeto `PreviewResult`.
 */
export async function previewTransaction(payload: SendPayload): Promise<PreviewResult> {
  
  const { from, to, assetId, amount, note } = payload;
  const network: Network = getActiveConfig().CHAIN_ID === 'mainnet-v1.0' ? 'MAINNET' : 'TESTNET';
  const algod = getAlgodClient(network);

  try {
    const sp = await algod.getTransactionParams().do();
    const feeMicroAlgos = Math.max(sp.fee, MIN_FEE_PER_TX);
    
    // 1. Validación de Opt-In (solo para ASAs/NFTs)
    if (assetId !== 0) {
      logEvent('tx_validation_optin_check', { address: to, assetId, result: 'pending' });
      const targetIsOptedIn = await isOptedIn(to, assetId, network);
      if (!targetIsOptedIn) {
        logEvent('tx_validation_optin_check_failed', { address: to, assetId, reason: 'not_opted_in' });
        return { ok: false, error: 'NOT_OPTED_IN', message: `La cuenta de destino no ha realizado opt-in al activo ASA #${assetId}.` };
      }
      logEvent('tx_validation_optin_check', { address: to, assetId, result: 'ok' });
    }
    
    const classifiedAsset = assetId !== 0 ? await classifyAsset(assetId, network) : null;
    const decimals = classifiedAsset?.decimals ?? 6;
    
    const amountInBaseUnits = parseUserAmountToBaseUnits(amount, decimals);
    if (amountInBaseUnits <= BigInt(0) && classifiedAsset?.type !== 'NFT') {
        return { ok: false, error: 'INVALID_AMOUNT', message: 'El monto debe ser mayor que cero.'};
    }
    
    const amountForBalanceCheck = assetId === 0 ? Number(amountInBaseUnits) : 0;
    const hasMinBalance = await checkMinBalance(from, amountForBalanceCheck, feeMicroAlgos, network);
    if (!hasMinBalance) {
      return { ok: false, error: 'INSUFFICIENT_BALANCE', message: "Saldo insuficiente para cubrir el monto, la tarifa y el requisito de saldo mínimo." };
    }

    const preview = await buildDisplayInfo(payload, network);

    return {
      ok: true,
      preview
    };

  } catch (error: any) {
    logEvent('ui_error_serialization', { where: 'previewTransaction', message: error.message });
    return { ok: false, error: 'PREVIEW_FAILED', message: error.message || 'Error inesperado al previsualizar la transacción.' };
  }
}

/**
 * Prepara y valida una transacción de Opt-In.
 */
export async function previewOptInTransaction(payload: { from: string, assetId: number }): Promise<OptInPreviewResult> {
    
    const { from, assetId } = payload;
    const network: Network = getActiveConfig().CHAIN_ID === 'mainnet-v1.0' ? 'MAINNET' : 'TESTNET';
    const algod = getAlgodClient(network);
    
    try {
        const sp = await algod.getTransactionParams().do();
        const feeMicroAlgos = Math.max(sp.fee, MIN_FEE_PER_TX);
        const MIN_BALANCE_FOR_OPTIN = 100000; // 0.1 ALGO

        const alreadyOptedIn = await isOptedIn(from, assetId, network);
        if (alreadyOptedIn) {
            logEvent('tx_validation_optin_check_failed', { address: from, assetId, reason: "already_opted_in" });
            return { ok: false, error: 'ALREADY_OPTED_IN', message: 'Ya has hecho opt-in a este activo.' };
        }
        
        const hasMinBalance = await checkMinBalance(from, 0, feeMicroAlgos, network, MIN_BALANCE_FOR_OPTIN);
        if (!hasMinBalance) {
            logEvent('tx_validation_optin_check_failed', { address: from, assetId, reason: "insufficient_balance" });
            return { ok: false, error: 'INSUFFICIENT_BALANCE', message: 'Saldo insuficiente. Se requiere al menos 0.1 ALGO adicional para hacer opt-in.' };
        }

        const classifiedAsset = await classifyAsset(assetId, network);

        const txData: TxPreviewData = {
            type: 'optin',
            from, to: from, assetId, amount: 0,
            feeMicroAlgos: feeMicroAlgos,
            firstRound: sp.firstRound,
            lastRound: sp.lastRound,
            genesisID: sp.genesisID,
            genesisHash: sp.genesisHash
        };

        const displayInfo: TransactionInfo = {
            type: TransactionType.AssetOptIn,
            from,
            fee: microalgosToAlgos(feeMicroAlgos),
            assetId,
            assetName: classifiedAsset.name,
            assetImageUrl: classifiedAsset.imageUrl,
            assetStandard: classifiedAsset.standard
        };
        
        return { ok: true, preview: { displayInfo, txData } };

    } catch (error: any) {
        logEvent('ui_error_serialization', { where: 'previewOptInTransaction', message: error.message });
        return { ok: false, error: 'PREVIEW_FAILED', message: error.message || 'Error inesperado al preparar el Opt-In.' };
    }
}
