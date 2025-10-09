import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function microalgosToAlgos(microalgos: number | bigint): number {
    return Number(microalgos) / 1_000_000;
}
