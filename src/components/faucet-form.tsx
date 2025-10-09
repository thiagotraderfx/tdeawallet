'use client';

import React from 'react';
import NextLink from 'next/link';
import { type FaucetFormState } from '@/lib/schema';
import { claimAlgo } from '@/app/actions';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Loader,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useFormState } from 'react-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      id="btnClaim"
      type="submit"
      className="w-full font-semibold text-base py-6"
      disabled={isPending}
      aria-disabled={isPending}
      size="lg"
    >
      {isPending ? (
        <>
          <Loader className="mr-2 h-5 w-5 animate-spin" />
          Procesando...
        </>
      ) : (
        'Solicitar 1 ALGO'
      )}
    </Button>
  );
}

export default function FaucetForm() {
  const initialState: FaucetFormState = { success: false, message: null };
  const [state, formAction] = useFormState(claimAlgo, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = React.useTransition();
  const [showDialog, setShowDialog] = React.useState(false);

  const wrappedAction = (payload: FormData) => {
    startTransition(() => {
      formAction(payload);
    });
  };

  React.useEffect(() => {
    if (!isPending && state.message) {
      setShowDialog(true);
    }
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={wrappedAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="address" className="font-medium">
            Dirección de Algorand
          </Label>
          <Input
            id="address"
            name="address"
            placeholder="Tu dirección de 58 caracteres"
            autoComplete="off"
            required
            disabled={isPending}
            className="h-12 text-base"
          />
          {state?.errors?.address && !state.success && (
            <p className="text-sm font-medium text-destructive pt-1">
              {state.errors.address[0]}
            </p>
          )}
        </div>
        <SubmitButton isPending={isPending} />
      </form>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-2">
                {state.success ? (
                  <CheckCircle2 className="text-green-600" />
                ) : (
                  <AlertCircle className="text-destructive" />
                )}
                <span>
                  {state.success ? 'Solicitud Exitosa' : 'Error en la Solicitud'}
                </span>
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {state.message}
              {state.success && state.txId && (
                <div className="mt-4">
                  <NextLink
                    href={`${state.explorerUrl}${state.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary underline"
                  >
                    Ver transacción
                    <ExternalLink className="h-4 w-4" />
                  </NextLink>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
