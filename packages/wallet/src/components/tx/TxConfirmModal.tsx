
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionType, type TransactionInfo } from '@tdea/algorand-utils';
import { toSvg } from 'jdenticon';

interface TxConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  txInfo: TransactionInfo | null;
  isSigning: boolean;
}

const Field: React.FC<{ label: string, value: React.ReactNode, isAddress?: boolean }> = ({ label, value, isAddress }) => (
  <div className="flex justify-between items-start text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-right font-medium ${isAddress ? 'font-mono text-xs' : ''} break-all`}>{value}</span>
  </div>
);

export function TxConfirmModal({ isOpen, onClose, onConfirm, txInfo, isSigning }: TxConfirmModalProps) {
  if (!txInfo) return null;

  const renderTxDetails = () => {
    switch (txInfo.type) {
      case TransactionType.Payment:
        return <Field label="Monto" value={`${txInfo.amount} ALGO`} />;
      case TransactionType.AssetTransfer:
        return (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Activo</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full" dangerouslySetInnerHTML={{ __html: toSvg(txInfo.assetId || 0, 20) }} />
                <span className="font-medium">{txInfo.assetName || `ASA #${txInfo.assetId}`}</span>
              </div>
            </div>
            <Field label="Cantidad" value={`${txInfo.amount} ${txInfo.assetUnit || ''}`} />
          </>
        );
      case TransactionType.AssetOptIn:
        return (
           <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Activo (Opt-In)</span>
              <div className="flex items-center gap-2">
                 {txInfo.assetImageUrl ? (
                    <img src={txInfo.assetImageUrl} alt={txInfo.assetName || ''} className="w-8 h-8 rounded-md object-cover" />
                 ) : (
                    <div className="w-8 h-8 rounded-full" dangerouslySetInnerHTML={{ __html: toSvg(txInfo.assetId || 0, 32) }} />
                 )}
                <span className="font-medium">{txInfo.assetName || `ASA #${txInfo.assetId}`}</span>
              </div>
            </div>
        );
      case TransactionType.NFTTransfer:
         return (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">NFT</span>
              <div className="flex items-center gap-2">
                 <img src={txInfo.assetImageUrl || ''} alt={txInfo.assetName || ''} className="w-10 h-10 rounded-lg object-cover" />
                <span className="font-medium">{txInfo.assetName}</span>
              </div>
            </div>
             <Field label="ID del Activo" value={txInfo.assetId} />
          </>
        );
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-xl">Confirmar Transacción</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Revisa los detalles cuidadosamente antes de firmar. Esta acción es irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-4">
          <Field label="Desde" value={txInfo.from.slice(0, 10) + '...'} isAddress />
          {txInfo.to && <Field label="Hacia" value={txInfo.to.slice(0, 10) + '...'} isAddress />}
          
          <hr/>

          {renderTxDetails()}
          
          <hr/>

          <Field label="Tarifa de Red" value={`${txInfo.fee} ALGO`} />
          {txInfo.assetStandard && <Field label="Estándar" value={txInfo.assetStandard} />}
          {txInfo.note && <Field label="Nota" value={txInfo.note} />}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isSigning}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSigning}>
            {isSigning ? 'Firmando...' : 'Firmar y Enviar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
