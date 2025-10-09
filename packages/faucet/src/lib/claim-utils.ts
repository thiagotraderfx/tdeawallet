"use server";

import { type FaucetFormState } from './schema';

export async function buildClaimResult(payload: Partial<FaucetFormState>): Promise<FaucetFormState> {
  const result: FaucetFormState = {
    success: payload.success || false,
    message: payload.message ? String(payload.message) : null,
  };

  if (payload.txId) {
    result.txId = String(payload.txId);
  }
  if (payload.explorerUrl) {
    result.explorerUrl = String(payload.explorerUrl);
  }
  if (payload.code) {
    result.code = String(payload.code);
  }
  
  if (payload.errors?.address?.[0]) {
    result.errors = { address: [String(payload.errors.address[0])] };
  }

  try {
    JSON.stringify(result);
  } catch (err: any) {
    console.error("[buildClaimResult] CRITICAL: FAILED TO SERIALIZE FINAL OBJECT", {
      error: err.message,
    });
    return {
      success: false,
      message: "Error interno del servidor: Fallo de serialización de respuesta.",
      code: "SERIALIZATION_ERROR",
    };
  }

  return result;
}
