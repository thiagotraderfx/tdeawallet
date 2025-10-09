"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getAllWallets, StoredWallet, lockWallet, unlockWallet, removeWallet as removeWalletFromDb, runMigration } from "@tdea/algorand-utils";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { OnboardingView } from "./OnboardingView";
import { CreateWalletView } from "./create-wallet-view";
import { ImportWalletView } from "./import-wallet-view";
import { UnlockWalletView } from "./unlock-wallet-view";
import { WalletDetailView } from "./wallet-detail-view";

type ViewState = "loading" | "onboarding" | "unlock" | "dashboard" | "create" | "import";

export default function WalletClient() {
  const [view, setView] = useState<ViewState>("loading");
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<StoredWallet | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { toast } = useToast();

  const loadWallets = useCallback(async () => {
    setView("loading");
    try {
      if (typeof window !== 'undefined') {
        await runMigration();
        const all = await getAllWallets();
        setWallets(all || []);
        if (Array.isArray(all) && all.length > 0) {
          setView("unlock");
        } else {
          setView("onboarding");
        }
      }
    } catch (err: any) {
      console.error("WalletClient loader error:", err);
      setView("onboarding");
      toast({variant: "destructive", title: "Error al cargar billeteras", description: "No se pudo acceder al almacenamiento seguro del navegador."});
    }
  }, [toast]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const handleCreate = () => {
    toast({title: "Billetera Creada", description: "Tu nueva billetera ha sido guardada de forma segura."});
    loadWallets();
    setView("unlock");
  };

  const handleImport = () => {
    toast({title: "Billetera Importada", description: "Tu billetera ha sido importada y guardada."});
    loadWallets();
    setView("unlock");
  };
  
  const handleUnlock = async (address: string, password: string) => {
    const walletToUnlock = wallets.find(w => w.address === address);
     if (!walletToUnlock) {
      toast({variant: "destructive", title: "Error", description: "La billetera no fue encontrada."});
      return;
    }
    
    setIsUnlocking(true);
    try {
        await unlockWallet(walletToUnlock, password);
        setActiveWallet(walletToUnlock);
        setView("dashboard");
        toast({title: "Billetera Desbloqueada"});
    } catch (e: any) {
         toast({variant: "destructive", title: "Error de Desbloqueo", description: e.message});
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLock = () => {
    if (activeWallet) {
      lockWallet(activeWallet.address);
      setActiveWallet(null);
      toast({title: "Billetera Bloqueada", description: "Tu sesión ha sido cerrada de forma segura."});
      setView("unlock");
    }
  };

  const handleRemove = async (address: string) => {
    await removeWalletFromDb(address);
    toast({title: "Billetera Eliminada"});
    if (activeWallet?.address === address) {
      setActiveWallet(null);
    }
    await loadWallets();
  };

  const renderView = () => {
    switch (view) {
        case "loading":
            return (
                <div data-test="wallet-loader" className="w-full h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader className="animate-spin h-8 w-8 text-primary" />
                        <span>Cargando billeteras...</span>
                    </div>
                </div>
            );
        case "onboarding":
            return <OnboardingView onCreate={() => setView("create")} onImport={() => setView("import")} />;
        case "create":
            return <CreateWalletView onWalletCreated={handleCreate} onBack={() => setView(wallets.length > 0 ? "unlock" : "onboarding")} />;
        case "import":
            return <ImportWalletView onWalletImported={handleImport} onBack={() => setView(wallets.length > 0 ? "unlock" : "onboarding")} />;
        case "unlock":
            return <UnlockWalletView wallets={wallets} onUnlock={handleUnlock} onRemove={handleRemove} onCreateNew={() => setView("create")} onImport={() => setView("import")} isUnlocking={isUnlocking} />;
        case "dashboard":
            if (activeWallet) {
                return <WalletDetailView storedWallet={activeWallet} onLock={handleLock} />;
            }
            // Fallback if state is inconsistent
            setView("unlock");
            return null;
        default:
            return (
                <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
                    <div className="text-center text-destructive">
                        <h3 className="font-bold text-lg">Error Inesperado</h3>
                        <p className="text-sm">La aplicación encontró un estado inválido. Intente recargar la página.</p>
                    </div>
                </div>
            );
    }
  };
  
  return <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">{renderView()}</div>;
}
