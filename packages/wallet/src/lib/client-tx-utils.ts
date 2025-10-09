
"use client";

import algosdk from 'algosdk';
import { getAlgodClient, type Network, waitForConfirmation, logEvent, type TxPreviewData } from '@tdea/algorand-utils';
import { signTransaction as signWithKey } from '@tdea/algorand-utils';


function buildTxFromPreview(preview: TxPreviewData, network: Network): algosdk.Transaction {
    const sp = {
        flatFee: true,
        fee: preview.feeMicroAlgos,
        firstRound: preview.firstRound,
        lastRound: preview.lastRound,
        genesisID: preview.genesisID,
        genesisHash: preview.genesisHash
    };
    const note = preview.noteBase64 ? new Uint8Array(Buffer.from(preview.noteBase64, 'base64')) : undefined;

    const from = preview.from;
    const to = preview.to;
    const amount = BigInt(preview.amount);

    if (preview.type === 'pay') {
        return algosdk.makePaymentTxnWithSuggestedParamsFromObject({ from, to, amount, suggestedParams: sp, note });
    } 
    
    const assetIndex = preview.assetId;
    if (assetIndex === undefined) throw new Error("Asset ID is missing for asset transaction");

    if (preview.type === 'axfer' || preview.type === 'nft') {
        return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ from, to, amount, assetIndex, suggestedParams: sp, note });
    } 
    
    if (preview.type === 'optin') {
        return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ from, to: from, amount: 0, assetIndex, suggestedParams: sp, note });
    }
    
    throw new Error(`Unsupported transaction type in preview: ${preview.type}`);
}


export async function signAndSendFromPreview(preview: TxPreviewData): Promise<{ txId: string }> {
    const network: Network = preview.genesisID === 'mainnet-v1.0' ? 'MAINNET' : 'TESTNET';
    const txn = buildTxFromPreview(preview, network);
    logEvent('tx_signing_initiated', { from: preview.from, type: txn.type?.toString() });

    const signedTxn = await signWithKey(preview.from, txn);
    logEvent('tx_signed', { type: txn.type?.toString(), txId: txn.txID(), from: preview.from, to: preview.to, assetId: preview.assetId });

    const algod = getAlgodClient(network);
    const { txId } = await algod.sendRawTransaction([signedTxn]).do();
    logEvent('tx_sent', { type: txn.type?.toString(), assetId: preview.assetId, txId });

    return { txId };
}
