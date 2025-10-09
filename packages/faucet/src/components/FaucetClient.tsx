
"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { FaucetForm } from "./faucet-form"
import { AlgorandLogo } from "@/components/icons/algorand-logo";
import { DonationCard } from "./donation-card";

export default function FaucetClient({ faucetBalance, explorerUrl, faucetAddress }: { faucetBalance: string, explorerUrl: string, faucetAddress: string }) {

  return (
    <div className="flex w-full flex-col items-center justify-center p-4 gap-8">
      <div className="flex w-full flex-col items-center justify-center gap-8">
        <main className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center mb-8 text-center">
              <AlgorandLogo className="w-16 h-16 mb-4 text-primary" />
              <h1 className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-gray-50">Dispensador de ALGO</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-sm">
                  Obtén tokens de prueba para la red de Algorand de forma rápida y sencilla.
              </p>
          </div>

          <Card className="w-full shadow-lg border-none">
            <CardHeader className="text-left">
               <p className="text-sm text-muted-foreground">Fondos disponibles</p>
               <p className="text-2xl font-bold tracking-tight">{faucetBalance} ALGO</p>
            </CardHeader>
            <CardContent>
              <FaucetForm explorerUrl={explorerUrl} />
            </CardContent>
          </Card>
        </main>
        
        <DonationCard address={faucetAddress} />
      </div>
    </div>
  );
}
