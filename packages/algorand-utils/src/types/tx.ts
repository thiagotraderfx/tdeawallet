import type { NftStandard } from '../assets/classifier';

export enum TransactionType {
    Payment = 'ALGO Payment',
    AssetTransfer = 'Asset Transfer',
    NFTTransfer = 'NFT Transfer',
    AssetOptIn = 'Asset Opt-In',
}

export interface TransactionInfo {
    type: TransactionType;
    from: string;
    to?: string;
    amount?: number | string;
    fee: number;
    assetId?: number;
    assetName?: string;
    assetUnit?: string;
    assetImageUrl?: string | null;
    assetStandard?: NftStandard;
    note?: string;
}

/**
 * Payload de entrada para iniciar el flujo de envío de una transacción.
 * Contiene la información inicial proporcionada por el usuario.
 */
export interface SendPayload {
  from: string;
  to: string;
  assetId: number; // 0 para ALGO
  amount: string; // Monto como string, para evitar problemas de precisión
  note?: string;
}

/**
 * Representa los datos planos y serializables de una transacción previsualizada.
 * Este objeto se puede pasar de forma segura del servidor al cliente.
 */
export interface TxPreviewData {
    type: 'pay' | 'axfer' | 'nft' | 'optin';
    from: string;
    to: string;
    assetId?: number;
    amount: string | number; // Monto en unidades base (microAlgos o la menor unidad del ASA)
    assetDecimals?: number;
    feeMicroAlgos: number;
    firstRound: number;
    lastRound: number;
    genesisID: string;
    genesisHash: string;
    noteBase64?: string;
}

/**
 * Resultado de la vista previa de la transacción.
 * Contiene todos los datos necesarios para que el usuario confirme
 * y para que se pueda ejecutar la transacción posteriormente.
 */
export interface TxPreview {
  // Información para mostrar en el modal de confirmación
  displayInfo: TransactionInfo;
  // Datos planos para reconstruir la transacción en el cliente
  txData: TxPreviewData;
}
