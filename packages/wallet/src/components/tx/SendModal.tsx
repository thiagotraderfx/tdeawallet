
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { waitForConfirmation, logEvent, type TxPreview } from '@tdea/algorand-utils';
import { previewTransaction } from '../../lib/tx-flow';
import { signAndSendFromPreview } from '../../lib/client-tx-utils';
import { isValidAddress } from 'algosdk';
import type { AssetInfo } from '../wallet-detail-view';
import { Loader } from 'lucide-react';
import { toSvg } from 'jdenticon';
import { TxConfirmModal } from './TxConfirmModal';
import { useBalances } from '../../hooks/useBalances';
import { formatAmount } from '../../lib/format';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetInfo[];
  fromAddress: string;
  initialAssetId?: number;
  onSuccess: () => void;
}

export function SendModal({ isOpen, onClose, assets, fromAddress, initialAssetId, onSuccess }: SendModalProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId?.toString() ?? '0');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txPreview, setTxPreview] = useState<TxPreview | null>(null);

  const { toast } = useToast();
  const assetMetas = assets.map(a => ({ id: a.id, decimals: a.decimals ?? 0 }));
  const { balances } = useBalances(fromAddress, assetMetas);
  
  useEffect(() => {
    if(isOpen) {
        setSelectedAssetId(initialAssetId?.toString() ?? '0');
        setToAddress('');
        setAmount('');
        setNote('');
        setTxPreview(null);
    }
  }, [isOpen, initialAssetId]);

  const selectedAsset = assets.find(a => a.id.toString() === selectedAssetId);
  const isNft = selectedAsset?.type === 'NFT';
  const effectiveAmount = isNft ? '1' : amount;

  const handleMaxButtonClick = () => {
    const balance = balances[selectedAssetId];
    if (balance != null) {
      setAmount(String(balance));
    }
  };

  const handlePreview = async () => {
    if (!selectedAsset) {
        toast({variant: 'destructive', title: "Activo no seleccionado", description: "Por favor, selecciona un activo para enviar."});
        return;
    }
    if (!isValidAddress(toAddress)) {
        toast({variant: 'destructive', title: "Dirección no válida", description: "Verifique y vuelva a intentar."});
        return;
    }
    
    const numericAmount = parseFloat(amount);
    const balance = balances[selectedAssetId] ?? 0;
    if (!isNft && numericAmount > balance) {
        toast({variant: 'destructive', title: "Saldo insuficiente", description: `Tu saldo es ${formatAmount(balance, selectedAsset.decimals)} ${selectedAsset.unitName || selectedAsset.name}`});
        return;
    }

    setIsLoading(true);
    const logPayload = {
        type: selectedAsset.id === 0 ? "pay" : "axfer",
        from: fromAddress,
        to: toAddress,
        assetId: selectedAsset.id,
        amount: effectiveAmount,
    };
    logEvent('send_tx_attempt', logPayload);

    try {
        const previewResult = await previewTransaction({
            from: fromAddress,
            to: toAddress,
            assetId: selectedAsset.id,
            amount: effectiveAmount,
            note,
        });

        if (!previewResult.ok) {
            logEvent('send_tx_fail', { ...logPayload, error: previewResult.message, code: previewResult.error });
            throw new Error(previewResult.message);
        }

        setTxPreview(previewResult.preview);

    } catch (e: any) {
        toast({variant: 'destructive', title: "Error de Validación", description: e.message});
        logEvent('send_tx_fail', { ...logPayload, error: e.message });
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
          
          toast({ title: "Transacción Enviada", description: `ID: ${txId.slice(0, 10)}...` });
          await waitForConfirmation(txId, 'TESTNET');
          
          logEvent('send_tx_success', { txId });
          toast({ title: "Transacción Confirmada", description: "La transferencia se ha completado con éxito." });
          onSuccess();
          onClose();

      } catch (e: any) {
          logEvent('send_tx_fail', { error: e.message, txId: txPreview.txData.from }); // a guess
          toast({variant: 'destructive', title: "Error en la Transacción", description: e.message});
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
              <DialogTitle>Enviar Activos</DialogTitle>
              <DialogDescription>
                Selecciona el activo, el destinatario y el monto a enviar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="asset-select">Activo a Enviar</Label>
                    <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                        <SelectTrigger id="asset-select"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {assets.map(asset => {
                                const balance = balances[String(asset.id)];
                                const label = balance != null 
                                    ? `${asset.name || `Asset #${asset.id}`} — ${formatAmount(balance, asset.decimals)}` 
                                    : `${asset.name || `Asset #${asset.id}`} — ...`;

                                return (
                                <SelectItem key={asset.id} value={String(asset.id)}>
                                    <div className="flex items-center gap-2">
                                        {asset.imageUrl ? <img src={asset.imageUrl} alt="" className="w-6 h-6 rounded-md"/> : <div className="w-6 h-6 rounded-full flex-shrink-0" dangerouslySetInnerHTML={{ __html: toSvg(asset.id, 24) }} />}
                                        <span>{label}</span>
                                    </div>
                                </SelectItem>
                            )})}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2"><Label>Dirección de Destino</Label><Input value={toAddress} onChange={e => setToAddress(e.target.value)} /></div>
                 {!isNft && (
                    <div className="space-y-2">
                        <Label>Monto</Label>
                        <div className="flex items-center gap-2">
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleMaxButtonClick}
                            disabled={balances[selectedAssetId] == null || balances[selectedAssetId]! <= 0}
                            aria-label="Usar saldo máximo"
                        >
                            MAX
                        </Button>
                        </div>
                    </div>
                )}
                 <div className="space-y-2"><Label>Nota (Opcional)</Label><Textarea value={note} onChange={e => setNote(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handlePreview} disabled={isLoading}>{isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : "Siguiente"}</Button>
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
