"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForConfirmation, logEvent, type TxPreview } from '@tdea/algorand-utils';
import { previewOptInTransaction } from '../../lib/tx-flow';
import { Loader } from 'lucide-react';
import { TxConfirmModal } from './TxConfirmModal';
import { useToast } from '@/hooks/use-toast';
import { signAndSendFromPreview } from '../../lib/client-tx-utils';


interface OptInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fromAddress: string;
  onSuccess: () => void; // Para refrescar la lista de activos
}

export function OptInDialog({ isOpen, onClose, fromAddress, onSuccess }: OptInDialogProps) {
  const [assetId, setAssetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txPreview, setTxPreview] = useState<TxPreview | null>(null);
  const { toast } = useToast();

  const handlePrepareOptIn = async () => {
    const id = parseInt(assetId, 10);
    if (isNaN(id) || id <= 0) {
      toast({variant: "destructive", title: "ID de Activo Inválido", description: "Por favor, introduce un número de ID válido."});
      return;
    }

    setIsLoading(true);
    logEvent('asa_optin_attempt', { assetId: id, address: fromAddress });

    try {
      const previewResult = await previewOptInTransaction({ from: fromAddress, assetId: id });
      
      if (!previewResult.ok) {
        logEvent('tx_validation_optin_check_failed', { address: fromAddress, assetId: id, reason: previewResult.error });
        throw new Error(previewResult.message);
      }
      
      setTxPreview(previewResult.preview);

    } catch (e: any) {
      const errorMessage = e.message || "Ocurrió un error inesperado.";
      toast({variant: "destructive", title: "Error al preparar Opt-In", description: errorMessage});
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndExecute = async () => {
    if (!txPreview) return;

    setIsLoading(true);
    setTxPreview(null);

    try {
      const { txId } = await signAndSendFromPreview(txPreview.txData);
      toast({ title: "Transacción de Opt-In Enviada", description: `ID: ${txId.slice(0, 10)}...` });
      
      await waitForConfirmation(txId, 'TESTNET');
      logEvent('tx_confirmed', { txId, round: -1 }); // Round info not available here
      toast({ title: "Opt-In Confirmado", description: `Ahora puedes recibir el activo #${txPreview.txData.assetId}.` });
      
      onSuccess();
      onClose();
    } catch (e: any) {
        logEvent('tx_sent_fail', { error: e.message });
        toast({variant: "destructive", title: "Error en la Transacción", description: e.message});
    } finally {
        setIsLoading(false);
    }
  }

  const closeAll = () => {
      setTxPreview(null);
      onClose();
  }
  
  return (
    <>
      <Dialog open={isOpen && !txPreview} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hacer Opt-In a un Activo (ASA)</DialogTitle>
            <DialogDescription>
              Esto te permitirá recibir un activo específico en tu billetera. Se requiere una pequeña tarifa de red.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="asset-id">ID del Activo</Label>
            <Input 
              id="asset-id" 
              type="number"
              value={assetId} 
              onChange={e => setAssetId(e.target.value)}
              placeholder="Introduce el número de ID del activo"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handlePrepareOptIn} disabled={isLoading}>
              {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : "Siguiente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {txPreview && <TxConfirmModal 
            isOpen={!!txPreview}
            onClose={closeAll}
            onConfirm={handleConfirmAndExecute}
            txInfo={txPreview.displayInfo}
            isSigning={isLoading}
        />}
    </>
  );
}
