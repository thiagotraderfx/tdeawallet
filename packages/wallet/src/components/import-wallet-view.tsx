"use client";

import React, { useState } from 'react';
import { importWallet, validateMnemonic } from '@tdea/algorand-utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Network } from '@tdea/algorand-utils';
import { useToast } from '@/hooks/use-toast';

interface ImportWalletViewProps {
    onWalletImported: () => void;
    onBack: () => void;
}

export function ImportWalletView({ onWalletImported, onBack }: ImportWalletViewProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [network, setNetwork] = useState<Network>('TESTNET');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (password.length < 12) {
      toast({variant: "destructive", title: "Error de Contraseña", description: "La contraseña debe tener al menos 12 caracteres."});
      return;
    }
    if (password !== confirmPassword) {
      toast({variant: "destructive", title: "Error de Contraseña", description: "Las contraseñas no coinciden."});
      return;
    }
    const cleanedMnemonic = mnemonic.trim().split(/\s+/).join(' ');
    if (!validateMnemonic(cleanedMnemonic)) {
        toast({variant: "destructive", title: "Error de Importación", description: "La frase de recuperación no es válida. Deben ser 25 palabras correctas."});
        return;
    }

    setIsLoading(true);
    try {
      await importWallet(cleanedMnemonic, password, undefined, network);
      onWalletImported();
    } catch (err: any) {
      toast({variant: "destructive", title: "Error al Importar", description: err.message});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border-none max-w-md mx-auto">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Importar Billetera</CardTitle>
            <CardDescription>Introduce tu frase de recuperación y una nueva contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
             <Alert variant="destructive">
                <AlertTitle>¡Atención!</AlertTitle>
                <AlertDescription>
                   Introduce únicamente tu frase de recuperación de 25 palabras de Algorand. No utilices esta función en un dispositivo que no sea de tu confianza.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label>Red</Label>
                <RadioGroup defaultValue="TESTNET" onValueChange={(v) => setNetwork(v as Network)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TESTNET" id="r-testnet-import" />
                    <Label htmlFor="r-testnet-import">Testnet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MAINNET" id="r-mainnet-import" />
                    <Label htmlFor="r-mainnet-import">Mainnet</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="mnemonic">Frase de Recuperación (25 palabras)</Label>
                <Textarea 
                    id="mnemonic"
                    name="mnemonic"
                    value={mnemonic}
                    onChange={e => setMnemonic(e.target.value)}
                    placeholder="palabra1 palabra2 palabra3 ..."
                    rows={3}
                    className="font-mono text-sm"
                />
            </div>
            <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña (mín. 12 caracteres)</Label>
            <Input id="password" type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <Input id="confirm-password" type="password" name="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handleImport} size="lg" className="w-full font-semibold" disabled={isLoading}>
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Importar y Cifrar Billetera
            </Button>
            <Button onClick={onBack} variant="link" className="w-full">Cancelar</Button>
        </CardContent>
    </Card>
  );
}
