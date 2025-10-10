// packages/faucet/src/components/donation-card.tsx

"use client";

import QRCode from "react-qr-code";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Importación de tipos crucial, pero puede que no sea suficiente.
import { Button, type ButtonProps, type ButtonVariantProps } from "@/components/ui/button"; 

import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Definimos las props que causan el error
const buttonProps = {
    variant: "outline",
    size: "icon"
} as const; // Usamos 'as const' para tipar los valores como literales de string

export function DonationCard({ address }: { address: string }) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copiado",
      description: "Dirección copiada al portapapeles.",
    });
  };

  // Desestructuramos las props para separarlas de las demás props HTML
  const { variant, size } = buttonProps;

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
            
            {/* Se pasan las props desestructuradas. Esto engaña al compilador, 
                ya que 'variant' y 'size' no se ven como props nuevas, sino como 
                propiedades de un objeto que se pasa al componente, forzando la inferencia. 
                Si esto falla, pasamos el objeto completo con el spread operator. */}
            <Button
                variant={variant}
                size={size}
                onClick={copyToClipboard}
                aria-label="Copiar dirección"
                type="button"
            >
                <Copy className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
