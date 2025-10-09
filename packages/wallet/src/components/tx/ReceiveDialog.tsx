
"use client";

import React from 'react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ReceiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function ReceiveDialog({ isOpen, onClose, address }: ReceiveDialogProps) {
  const { toast } = useToast();
  const explorerUrl = `https://testnet.explorer.perawallet.app/address/${address}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copiado",
      description: "Tu dirección ha sido copiada al portapapeles.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibir Activos</DialogTitle>
          <DialogDescription>
            Comparte tu dirección o escanea el código QR para recibir ALGO, ASAs o NFTs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg border">
                <QRCode value={address} size={200} />
            </div>
            <div className="flex w-full items-center space-x-2">
                <Input type="text" value={address} readOnly className="font-mono text-xs flex-grow"/>
                <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Copiar dirección">
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
            <Alert variant="destructive" className="w-full">
                <AlertTitle className="font-semibold">¡Importante!</AlertTitle>
                <AlertDescription>
                    Para recibir un ASA o NFT de otra billetera, primero debes hacer "opt-in" a ese activo.
                </AlertDescription>
            </Alert>
        </div>
        <DialogFooter>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4"/>
                    Ver en Explorer
                </Button>
            </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
