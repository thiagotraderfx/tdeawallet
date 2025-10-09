
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Import } from "lucide-react";

interface OnboardingViewProps {
    onCreate: () => void;
    onImport: () => void;
}

export function OnboardingView({ onCreate, onImport }: OnboardingViewProps) {

  return (
    <div data-test="onboarding-view" className="flex items-center justify-center w-full">
        <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Bienvenido a TdeA Wallet</CardTitle>
            <CardDescription>Tu billetera segura para el ecosistema Algorand.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <Button data-test="create-wallet" onClick={onCreate} size="lg">
            <PlusCircle className="mr-2"/>
            Crear Nueva Billetera
            </Button>
            <Button data-test="import-wallet" onClick={onImport} variant="secondary" size="lg">
            <Import className="mr-2"/>
            Importar Billetera
            </Button>
        </CardContent>
        </Card>
    </div>
  );
}
