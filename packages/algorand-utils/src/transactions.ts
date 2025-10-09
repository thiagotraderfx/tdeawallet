import { getIndexerClient, type Network } from './config';
import { logEvent } from './logger';

// Normaliza el formato de la transacción a un modelo interno.
function normalizeTx(tx: any): Transaction {
  let details: any = tx['payment-transaction'] || tx['asset-transfer-transaction'] || {};

  return {
    id: tx.id,
    type: tx['tx-type'],
    from: tx.sender,
    to: details.receiver,
    fee: tx.fee,
    confirmedRound: tx['confirmed-round'],
    timestamp: tx['round-time'],
    assetId: details['asset-id'],
    amount: details.amount,
    note: tx.note ? Buffer.from(tx.note, 'base64').toString('utf8') : undefined,
    status: 'confirmed'
  };
}

export interface Transaction {
  id: string;
  type: 'pay'|'axfer'|'acfg'|'appl'|string;
  from: string;
  to?: string;
  fee: number;
  confirmedRound?: number;
  timestamp?: number;
  assetId?: number;
  amount?: number | bigint;
  note?: string;
  status: 'confirmed'|'pending'|'failed';
}

/**
 * Fetches transaction history for a given address from the Algorand Indexer.
 * @param address The Algorand address to query.
 * @param limit The maximum number of transactions to return.
 * @param nextToken A token for paginating to the next set of results.
 * @returns A promise that resolves with the transaction data from the indexer.
 */
export async function getTransactions(address: string, limit: number = 25, nextToken?: string, network: Network = 'TESTNET'): Promise<{ txs: Transaction[], next: string | undefined }> {
  const indexer = getIndexerClient(network);
  
  try {
    let query = indexer.lookupAccountTransactions(address).limit(limit);
    if (nextToken) {
      query = query.nextToken(nextToken);
    }
    const response = await query.do();
    const normalizedTxs = (response.transactions || []).map(normalizeTx);
    
    logEvent('ui_tx_history_load', { address, limit, count: normalizedTxs.length, nextToken: !!nextToken });

    return {
        txs: normalizedTxs,
        next: response['next-token']
    };

  } catch (error: any) {
    logEvent('ui_tx_history_error', { address, error: error.message });
    console.error("Failed to fetch transaction history:", error);
    // Re-throw the error to be handled by the calling component
    if (error.response && error.response.status === 429) {
      throw new Error("Se ha excedido el límite de solicitudes. Por favor, espera un momento.");
    }
    throw new Error("No se pudo cargar el historial de transacciones desde el indexer.");
  }
}
