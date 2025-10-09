
"use client";

import QRCode from "react-qr-code";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DonationCard({ address }: { address: string }) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copiado",
      description: "Dirección copiada al portapapeles.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-4 shadow-lg border-none">
      <CardHeader className="items-center text-center pb-4">
        <CardTitle className="text-2xl">¡Apoya el Dispensador!</CardTitle>
        <CardDescription>
          Tu donación mantiene el grifo fluyendo para todos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg border">
            <QRCode value={address} size={160} />
        </div>
        <p className="text-sm text-muted-foreground px-4 text-center">
            Escanea el QR o copia la dirección para enviar ALGO.
        </p>
        <div className="flex w-full items-center space-x-2">
            <Input type="text" value={address} readOnly className="font-mono text-xs flex-grow"/>
            <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Copiar dirección">
                <Copy className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
