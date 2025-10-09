
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader, AlertTriangle, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyAndReveal, logEvent } from '@tdea/algorand-utils';

interface RevealMnemonicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function RevealMnemonicDialog({ isOpen, onClose, address }: RevealMnemonicDialogProps) {
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [step, setStep] = useState<'password' | 'reveal'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPassword('');
        setMnemonic('');
        setStep('password');
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'reveal') {
      timer = setTimeout(() => {
        toast({
          title: "Seguridad",
          description: "La frase de recuperación se ha ocultado automáticamente.",
          variant: "destructive",
        });
        logEvent('ui_reveal_mnemonic_auto_hide', { address });
        onClose();
      }, 60000);
    }
    return () => clearTimeout(timer);
  }, [step, onClose, toast, address]);

  const handleVerify = async () => {
    setIsLoading(true);
    logEvent('ui_reveal_mnemonic_attempt', { address });
    try {
      const revealedMnemonic = await verifyAndReveal(address, password);
      setMnemonic(revealedMnemonic);
      setStep('reveal');
      logEvent('ui_reveal_mnemonic_success', { address });
    } catch (e: any) {
      toast({variant: "destructive", title: "Error de Verificación", description: e.message});
      logEvent('ui_reveal_mnemonic_failed', { address, reason: 'incorrect_password' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    logEvent('ui_reveal_mnemonic_copied', { address });
    toast({ title: "Copiado", description: "Frase de recuperación copiada al portapapeles." });
  };

  const downloadMnemonic = () => {
    const blob = new Blob([`Dirección: ${address}\n\nFrase de Recuperación (Mnemonic):\n${mnemonic}\n\nGUARDE ESTE ARCHIVO EN UN LUGAR EXTREMADAMENTE SEGURO. NO LO COMPARTA CON NADIE.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
a.href = url;
    a.download = `algorand-wallet-${address.slice(0, 6)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logEvent('ui_reveal_mnemonic_downloaded', { address });
  };

  const renderPasswordStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Verificar Identidad</DialogTitle>
        <DialogDescription>
          Introduce tu contraseña para revelar tu frase de recuperación secreta. Esta es una operación de alto riesgo.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡Acción de Seguridad Crítica!</AlertTitle>
          <AlertDescription>
            Nunca compartas tu frase de recuperación. Cualquiera con acceso a ella puede robar tus fondos.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña de la Billetera</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleVerify} disabled={isLoading}>
          {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : "Verificar y Revelar"}
        </Button>
      </DialogFooter>
    </>
  );

  const renderRevealStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Tu Frase de Recuperación Secreta</DialogTitle>
        <DialogDescription>
          Guarda estas 25 palabras en orden. Se ocultará automáticamente en 60 segundos.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 rounded-md border p-4 font-mono text-sm">
          {mnemonic.split(' ').map((word, index) => (
            <div key={index} className="flex items-baseline">
              <span className="text-muted-foreground mr-2 w-6 text-right">{index + 1}.</span>
              <span>{word}</span>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button variant="secondary" onClick={copyMnemonic}><Copy className="mr-2 h-4 w-4" />Copiar</Button>
        <Button variant="secondary" onClick={downloadMnemonic}><Download className="mr-2 h-4 w-4" />Descargar</Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {step === 'password' ? renderPasswordStep() : renderRevealStep()}
      </DialogContent>
    </Dialog>
  );
}
