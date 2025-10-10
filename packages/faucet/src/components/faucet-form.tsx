// packages/faucet/src/components/faucet-form.tsx

"use client";

import React, { useActionState } from "react";
import NextLink from "next/link";
import { type FaucetFormState } from "../lib/schema";
import { claimAlgo } from "../lib/actions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

// 1. Definimos las props problemáticas fuera del componente SubmitButton.
const submitButtonProps = {
    size: "lg",
} as const;

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      id="btnClaim"
      type="submit"
      className="w-full font-semibold text-base py-6"
      disabled={isPending}
      aria-disabled={isPending}
      // 2. APLICAMOS EL HACK FINAL: Pasamos las props con spread y casting 'as any'
      {...(submitButtonProps as any)}
    >
      {isPending ? (
        <>
          <Loader className="mr-2 h-5 w-5 animate-spin" />
          Procesando...
        </>
      ) : (
        "Solicitar 1 ALGO"
      )}
    </Button>
  );
}

export function FaucetForm({ explorerUrl }: { explorerUrl: string }) {
  const initialState: FaucetFormState = { success: false, message: null };
  const [state, formAction] = useActionState(claimAlgo, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = React.useTransition();

  const wrappedAction = (payload: FormData) => {
    startTransition(() => {
      formAction(payload);
    });
  };

  React.useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={wrappedAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="address" className="font-medium">Dirección de Algorand</Label>
          <Input
            id="address"
            name="address"
            placeholder="Tu dirección de 58 caracteres"
            autoComplete="off"
            required
            disabled={isPending}
            className="h-12 text-base"
          />
          {state?.errors?.address && !isPending && !state.success && (
            <p className="text-sm font-medium text-destructive pt-1">
              {state.errors.address[0]}
            </p>
          )}
        </div>
        <SubmitButton isPending={isPending} />
      </form>

      {!isPending && state.message && (
         <div className="mt-4 text-center p-3 rounded-md bg-accent">
          {state.success ? (
            <div className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5"/>
              <span>¡Algo Enviado!</span>
              {state.txId && (
                 <NextLink
                    href={`${explorerUrl}${state.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary underline"
                  >
                    Ver transacción
                    <ExternalLink className="h-4 w-4" />
                  </NextLink>
              )}
            </div>
          ) : (
            <div className="text-sm font-medium text-destructive flex items-center justify-center gap-2">
               <AlertCircle className="w-5 h-5"/>
              <span>{state.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
}
