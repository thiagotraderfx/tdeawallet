"use client";

import { useCallback, useEffect, useState } from "react";
import { getAlgodClient, microalgosToAlgos } from "@tdea/algorand-utils";

type AssetMeta = { id: number; decimals?: number };

function assetAmountToUnits(amount: number | bigint, decimals: number): number {
    if (decimals === 0) return Number(amount);
    return Number(amount) / Math.pow(10, decimals);
}

export function useBalances(address: string | null, assets: AssetMeta[]) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!address) {
      setBalances({});
      return;
    }
    setLoading(true);
    try {
      const algod = getAlgodClient('TESTNET'); // Assuming testnet for now
      const accountInfo = await algod.accountInformation(address).do();
      
      const result: Record<string, number> = {};
      
      // native ALGO
      result["0"] = microalgosToAlgos(accountInfo.amount || 0);

      // assets
      (accountInfo.assets || []).forEach((asset: any) => {
        const assetId = String(asset['asset-id']);
        const meta = assets.find(m => String(m.id) === assetId);
        const decimals = meta?.decimals ?? 0;
        result[assetId] = assetAmountToUnits(asset.amount, decimals);
      });

      setBalances(result);
    } catch (e) {
      console.error("[useBalances] failed", e);
      setBalances({});
    } finally {
      setLoading(false);
    }
  }, [address, JSON.stringify(assets)]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading, refresh: fetchBalances };
}
