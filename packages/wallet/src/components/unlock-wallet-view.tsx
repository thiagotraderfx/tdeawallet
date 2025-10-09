
"use client";

import React, { useState, useEffect } from "react";
import type { StoredWallet } from "@tdea/algorand-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, PlusCircle, Trash2, Home, Import } from "lucide-react";
import Link from "next/link";
import { toSvg } from "jdenticon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from '@/hooks/use-toast';

interface UnlockWalletViewProps {
    wallets: StoredWallet[];
    onUnlock: (address: string, password: string) => void;
    onRemove: (address: string) => void;
    onCreateNew: () => void;
    onImport: () => void;
    isUnlocking: boolean;
}

const WalletDisplay = ({ wallet }: { wallet: StoredWallet }) => (
    <div className="flex items-center gap-3 truncate">
        <div className="w-8 h-8 rounded-full bg-gray-100 p-1 flex-shrink-0" dangerouslySetInnerHTML={{ __html: toSvg(wallet.address, 28) }} />
        <div className="flex flex-col text-left truncate">
          <span className="font-semibold truncate">{wallet.label}</span>
          <span className="text-muted-foreground font-mono text-xs truncate">{`${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}`}</span>
        </div>
    </div>
);


export function UnlockWalletView({ wallets, onUnlock, onRemove, onCreateNew, onImport, isUnlocking }: UnlockWalletViewProps) {
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].address);
    }
  }, [wallets, selectedWallet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!selectedWallet) {
        toast({variant: "destructive", title: "Error", description: "Por favor, selecciona una billetera."});
        return;
    }
    onUnlock(selectedWallet, password);
  };
  
  const selectedWalletData = wallets.find(w => w.address === selectedWallet);

  return (
    <Card className="w-full shadow-lg border-none max-w-md mx-auto">
        <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Billetera TdeA</CardTitle>
        <CardDescription>Desbloquea tu billetera o crea una nueva.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
        {wallets.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="wallet-select">Selecciona una billetera</Label>
                    <div className='flex items-center gap-2'>
                        <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                            <SelectTrigger id="wallet-select" className="flex-grow h-auto py-2">
                                <SelectValue>
                                   {selectedWalletData ? <WalletDisplay wallet={selectedWalletData} /> : "Elige una billetera..."}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                            {wallets.map(w => (
                                <SelectItem key={w.address} value={w.address}>
                                    <WalletDisplay wallet={w} />
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <ConfirmDialog
                          trigger={
                            <Button type="button" variant="ghost" size="icon" aria-label="Eliminar billetera seleccionada" disabled={!selectedWallet}>
                                <Trash2 className="text-destructive"/>
                            </Button>
                          }
                          title="¿Estás seguro de que quieres eliminar esta billetera?"
                          description="Esta acción no se puede deshacer. Necesitarás tu frase de recuperación para volver a importar la billetera."
                          confirmLabel="Eliminar"
                          onConfirm={() => selectedWallet && onRemove(selectedWallet)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unlock-password">Contraseña</Label>
                    <Input id="unlock-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Introduce tu contraseña" />
                </div>
                <Button type="submit" size="lg" className="w-full font-semibold" disabled={isUnlocking}>
                    {isUnlocking && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    Desbloquear
                </Button>
            </form>
        ) : (
             <div className="text-center text-muted-foreground p-4 border rounded-lg">
                <p>No tienes billeteras guardadas en este dispositivo.</p>
            </div>
        )}
        <div className="grid grid-cols-2 gap-3 mt-4">
            <Button onClick={onCreateNew} variant="secondary" className="font-semibold">
            <PlusCircle className="mr-2" /> Crear Nueva
            </Button>
            <Button onClick={onImport} variant="secondary" className="font-semibold">
            <Import className="mr-2" /> Importar
            </Button>
        </div>
        <div className="mt-2">
            <Link href="/" prefetch={false}>
                <Button variant="link" className="w-full">
                    <Home className="mr-2" /> Volver al Inicio
                </Button>
            </Link>
        </div>
        </CardContent>
    </Card>
  );
}
