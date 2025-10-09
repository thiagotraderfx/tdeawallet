
"use client";

import React from 'react';
import { SendModal } from './SendModal';
import { ReceiveDialog } from './ReceiveDialog';
import { OptInDialog } from './OptInDialog';
import type { AssetInfo } from '../wallet-detail-view';

interface SendReceiveDialogsProps {
  dialogState: { type: 'send' | 'receive' | 'opt-in' | 'reveal-mnemonic' | null, assetId?: number };
  onClose: () => void;
  assets: AssetInfo[];
  fromAddress: string;
  onSuccess: () => void;
}

/**
 * Componente orquestador que gestiona la visibilidad de los diferentes
 * modales transaccionales (Enviar, Recibir, Opt-In).
 */
export function SendReceiveDialogs({
  dialogState,
  onClose,
  assets,
  fromAddress,
  onSuccess,
}: SendReceiveDialogsProps) {

  return (
    <>
      <SendModal
        isOpen={dialogState.type === 'send'}
        onClose={onClose}
        assets={assets}
        fromAddress={fromAddress}
        initialAssetId={dialogState.assetId}
        onSuccess={onSuccess}
      />
      <ReceiveDialog
        isOpen={dialogState.type === 'receive'}
        onClose={onClose}
        address={fromAddress}
      />
      <OptInDialog
        isOpen={dialogState.type === 'opt-in'}
        onClose={onClose}
        fromAddress={fromAddress}
        onSuccess={onSuccess}
      />
    </>
  );
}
