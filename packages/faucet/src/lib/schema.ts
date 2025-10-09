import { z } from "zod";
import algosdk from "algosdk";

export const FaucetFormSchema = z.object({
  address: z.string({
    required_error: "Por favor, introduce una dirección de Algorand.",
  })
  .trim()
  .refine((address) => {
    try {
      return algosdk.isValidAddress(address);
    } catch (e) {
      return false;
    }
  }, {
    message: "La dirección de Algorand no es válida.",
  }),
});

export type FaucetFormState = {
  success: boolean;
  message: string | null;
  txId?: string;
  explorerUrl?: string;
  code?: string;
  errors?: {
    address?: string[];
  };
};
