import { mnemonicToSecretKey, isValidAddress as isValidAlgoAddress } from "algosdk";

/**
 * Validate a 25-word mnemonic (Algorand).
 * Returns true/false.
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    // mnemonicToSecretKey throws if invalid
    mnemonicToSecretKey(mnemonic.trim());
    return true;
  } catch (err) {
    return false;
  }
}

export const isValidAddress = isValidAlgoAddress;
