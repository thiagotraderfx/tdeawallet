
"use client";

import React, { useState, useEffect } from 'react';
import { createWallet, type Network } from '@tdea/algorand-utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff, Copy, AlertTriangle, Loader } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CreateWalletViewProps {
    onWalletCreated: () => void;
    onBack: () => void;
}

export function CreateWalletView({ onWalletCreated, onBack }: CreateWalletViewProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [network, setNetwork] = useState<Network>('TESTNET');
  const [step, setStep] = useState<"password" | "mnemonic">("password");
  const [generatedData, setGeneratedData] = useState<{ address: string, mnemonic: string } | null>(null);
  const [mnemonicVisible, setMnemonicVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (step === 'mnemonic' && mnemonicVisible) {
      const timer = setTimeout(() => {
        setMnemonicVisible(false);
        toast({
          title: "Tiempo agotado",
          description: "La frase de recuperación se ha ocultado por seguridad.",
          variant: "destructive"
        });
      }, 60000); 

      return () => clearTimeout(timer);
    }
  }, [mnemonicVisible, step, toast]);


  const handleGenerate = async () => {
    if (password.length < 12) {
      toast({variant: "destructive", title: "Error de Contraseña", description: "La contraseña debe tener al menos 12 caracteres."});
      return;
    }
    if (password !== confirmPassword) {
      toast({variant: "destructive", title: "Error de Contraseña", description: "Las contraseñas no coinciden."});
      return;
    }

    setIsLoading(true);
    try {
      const { mnemonic, storedWallet } = await createWallet(password, undefined, network);
      setGeneratedData({ address: storedWallet.address, mnemonic });
      setStep("mnemonic");
    } catch (err: any) {
      toast({variant: "destructive", title: "Error al Crear Billetera", description: err.message});
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndFinish = () => {
    onWalletCreated();
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: `${label} copiado al portapapeles.` });
  };
  
  if (step === "mnemonic") {
    return (
        <Card className="w-full shadow-lg border-none max-w-md mx-auto">
            <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Guarda tu Frase de Recuperación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Advertencia de Seguridad Crítica!</AlertTitle>
                <AlertDescription>
                Anota estas 25 palabras en orden y guárdalas en un lugar seguro y secreto.
                Es la **única** forma de recuperar tu billetera. Si la pierdes, tus fondos serán inaccesibles para siempre.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="mnemonic-display">Frase Mnemónica Secreta (25 palabras)</Label>
                <div className="flex items-center space-x-2">
                <Input
                    id="mnemonic-display"
                    value={generatedData?.mnemonic || ""}
                    readOnly
                    type={mnemonicVisible ? "text" : "password"}
                    className="font-mono text-xs tracking-wider"
                />
                <Button variant="outline" size="icon" onClick={() => setMnemonicVisible(!mnemonicVisible)}>
                    {mnemonicVisible ? <EyeOff /> : <Eye />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedData?.mnemonic || "", "Frase mnemónica")}>
                    <Copy />
                </Button>
                </div>
            </div>
            <Button onClick={handleConfirmAndFinish} className="w-full">He guardado mi frase, finalizar</Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-none max-w-md mx-auto">
      <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Crear Nueva Billetera</CardTitle>
          <CardDescription>Establece una contraseña segura para cifrar tu nueva billetera.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
          <div className="space-y-2">
          <Label>Red</Label>
            <RadioGroup defaultValue="TESTNET" onValueChange={(v) => setNetwork(v as Network)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TESTNET" id="r-testnet" />
                <Label htmlFor="r-testnet">Testnet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MAINNET" id="r-mainnet" />
                <Label htmlFor="r-mainnet">Mainnet</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
          <Label htmlFor="password">Contraseña (mín. 12 caracteres)</Label>
          <Input id="password" type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
          <Input id="confirm-password" type="password" name="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} size="lg" className="w-full font-semibold" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Generar Billetera Segura
          </Button>
          <Button onClick={onBack} variant="link" className="w-full">Cancelar</Button>
      </CardContent>
    </Card>
  );
}
