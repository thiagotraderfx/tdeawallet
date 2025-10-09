// src/app/page.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Droplets } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <Card className="max-w-md w-full shadow-lg border border-border/40 rounded-2xl p-6 text-center">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Wallet className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold font-inter tracking-tight text-foreground">
              Bienvenido a TdeA Wallet
            </CardTitle>
            <p className="text-sm text-muted-foreground font-roboto-mono">
              Administra tus billeteras Algorand de forma segura y rápida.
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-3 mt-4">
          <Link href="/wallet">
            <Button className="w-52 font-inter font-semibold text-base">
              Entrar a la Wallet
            </Button>
          </Link>
          <Link href="/faucet">
            <Button variant="outline" className="w-52 font-inter font-semibold text-base">
              <Droplets className="mr-2 h-4 w-4" />
              Ir al Faucet
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground font-roboto-mono mt-2">
            Si no tienes una billetera guardada, podrás crear o importar una nueva.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
