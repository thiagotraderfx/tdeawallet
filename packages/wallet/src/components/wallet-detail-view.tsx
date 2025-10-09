
'use client';

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { StoredWallet } from '@tdea/algorand-utils';
import {
  getAlgodClient,
  type Network,
  getBalanceInUsd,
  logEvent,
  microalgosToAlgos,
  classifyAsset,
  saveWallet
} from '@tdea/algorand-utils';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  RefreshCcw,
  Send,
  Download,
  Settings,
  TestTube2,
  Check,
  Pencil,
  Copy,
  X,
  Eye,
  ChevronDown,
  Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toSvg } from 'jdenticon';
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionHistory } from "./TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Truncate } from "@/components/ui/truncate";
import { cn } from "@/lib/utils";
import { SendReceiveDialogs } from './tx/SendReceiveDialogs';
import { RevealMnemonicDialog } from './settings/RevealMnemonicDialog';
import { getCachedAsset, setCachedAsset } from '../cache/assets-cache';
import type { ClassifiedAsset } from '@tdea/algorand-utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import QRCode from 'react-qr-code';

/**
 * WalletDetailView - Full production-ready single-file component
 * - Location: packages/wallet/components/WalletDetailView.tsx
 *
 * Guarantees:
 * - Keeps original business logic (refreshData, polling, asset merging)
 * - Prevents jdenticon & remote image overflow from breaking layout
 * - Staggers asset metadata fetches to avoid blocking main thread
 * - Defensive fallbacks to avoid blank page / External Page errors
 * - Provides copy-to-clipboard, QR modal, refresh, lock, send, receive hooks
 *
 * NOTE: This file is self-contained for the wallet-detail view. It expects
 * existing local components referenced above (TransactionHistory, SendReceiveDialogs,
 * RevealMnemonicDialog, UI primitives, and cache helpers).
 */

/* ---------------------------- Types ---------------------------- */

export type AssetInfo = ClassifiedAsset & {
  balance: bigint;
  loadingMetadata?: boolean;
  maybeRemovedAt?: number | null;
};

type AssetState = {
  byId: Map<number, AssetInfo>;
  order: number[];
  algoBalance: number;
  usdBalance: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt?: number | null;
};

type AssetAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ALGO_BALANCE'; payload: { algo: number; usd: string | null } }
  | { type: 'MERGE_ASSETS'; payload: { assetId: number; balance: bigint }[] }
  | { type: 'UPDATE_ASSET_METADATA'; payload: { assetId: number; metadata: ClassifiedAsset } }
  | { type: 'REMOVE_ASSET'; payload: number }
  | { type: 'SET_LAST_UPDATED'; payload: number }
  | { type: 'RESET_STATE' };


/* --------------------------- Reducer -------------------------- */

function assetReducer(state: AssetState, action: AssetAction): AssetState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_ALGO_BALANCE':
      return { ...state, algoBalance: action.payload.algo, usdBalance: action.payload.usd };
    case 'MERGE_ASSETS': {
      const byId = new Map(state.byId);
      const newOrder = [...state.order];
      const incomingAssetMap = new Map(action.payload.map(a => [a.assetId, a.balance]));

      action.payload.forEach(({ assetId, balance }) => {
        const existing = byId.get(assetId);
        if (existing) {
          existing.balance = balance;
          existing.maybeRemovedAt = null;
        } else {
          byId.set(assetId, {
            id: assetId,
            type: 'FT',
            balance,
            decimals: 0,
            loadingMetadata: true,
            name: `Asset #${assetId}`,
            net: 'TESTNET'
          });
          if (!newOrder.includes(assetId)) newOrder.push(assetId);
        }
      });

      // mark possibly removed assets
      state.order.forEach(id => {
        if (!incomingAssetMap.has(id)) {
          const asset = byId.get(id);
          if (asset && !asset.maybeRemovedAt) {
            asset.maybeRemovedAt = Date.now();
          }
        }
      });

      return { ...state, byId, order: newOrder };
    }
    case 'UPDATE_ASSET_METADATA': {
      const { assetId, metadata } = action.payload;
      const newById = new Map(state.byId);
      const existing = newById.get(assetId);
      if (existing) {
        newById.set(assetId, {
          ...existing,
          ...metadata,
          loadingMetadata: false
        });
      }
      return { ...state, byId: newById };
    }
    case 'REMOVE_ASSET': {
      const byId = new Map(state.byId);
      byId.delete(action.payload);
      const order = state.order.filter(id => id !== action.payload);
      return { ...state, byId, order };
    }
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdatedAt: action.payload };
    case 'RESET_STATE':
        return { ...initialState };
    default:
      return state;
  }
}

/* ------------------------ Initial State ----------------------- */

const initialState: AssetState = {
  byId: new Map(),
  order: [],
  algoBalance: 0,
  usdBalance: null,
  isLoading: true,
  isRefreshing: false,
  lastUpdatedAt: null
};

const POLL_BALANCE_MS = process.env.NEXT_PUBLIC_POLL_BALANCE_MS ? parseInt(process.env.NEXT_PUBLIC_POLL_BALANCE_MS, 10) : 10000;
const REMOVAL_GRACE_MS = POLL_BALANCE_MS * 3;

/* ----------------------- Visual Subcomponents ------------------ */

/**
 * Ensures images and SVGs never exceed the bounds of their container.
 * Uses overflow-hidden + object-contain and explicit aspect square wrappers.
 */

function TokenRow({ asset, onSend }: { asset: AssetInfo, onSend: () => void }) {
  if (asset.loadingMetadata) return <TokenRowSkeleton />;

  const sanitizedName = asset.name?.replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? `Asset #${asset.id}`;
  const decimals = typeof asset.decimals === 'number' ? asset.decimals : 0;
  const rawAmount = Number(asset.balance);
  const uiAmount = decimals > 0 ? rawAmount / (10 ** decimals) : rawAmount;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent group">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 truncate cursor-default">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={sanitizedName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const parent = e.currentTarget.parentElement as HTMLElement | null;
                      if (parent) parent.innerHTML = toSvg(asset.id, 40);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: toSvg(asset.id, 40) }} />
                )}
              </div>

              <div className="truncate">
                <p className="font-semibold truncate" title={sanitizedName}>{sanitizedName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {asset.unitName ? `${asset.unitName} - ID: ${asset.id}` : `ID: ${asset.id}`}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Asset ID: {asset.id}</p>
            {asset.unitName && <p>Unit: {asset.unitName}</p>}
            {asset.standard && <p>Standard: {asset.standard}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-2">
        <p className="font-semibold font-mono">
          {new Intl.NumberFormat(undefined, { maximumFractionDigits: Math.min(decimals, 6) }).format(uiAmount)}
        </p>
        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={onSend}>
          <Send />
        </Button>
      </div>
    </div>
  );
}

function NftCard({ asset, onSend }: { asset: AssetInfo, onSend: () => void }) {
  if (asset.loadingMetadata) return <NftCardSkeleton />;

  const sanitizedName = asset.name?.replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? `NFT #${asset.id}`;

  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
        {asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={sanitizedName}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              const parent = e.currentTarget.parentElement as HTMLElement | null;
              if (parent) parent.innerHTML = toSvg(asset.id, 128);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: toSvg(asset.id, 128) }} />
        )}
      </div>

      <div className="p-2">
        <p className="font-semibold text-sm truncate" title={sanitizedName}>{sanitizedName}</p>
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <div>ID: <Truncate text={asset.id.toString()} startChars={4} endChars={4} /></div>
          {asset.balance > 0 && <span className="font-mono font-semibold">x{asset.balance.toString()}</span>}
        </div>
      </div>

      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button onClick={onSend} variant="secondary">Enviar</Button>
      </div>
    </Card>
  );
}

/* ---------------------------- Skeletons ------------------------- */

function TokenRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

function NftCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-2 space-y-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  );
}

/* ---------------------- WalletDetailView ----------------------- */

interface WalletDetailViewProps {
  storedWallet: StoredWallet;
  onLock: () => void;
}

export function WalletDetailView({ storedWallet: initialStoredWallet, onLock }: WalletDetailViewProps) {
  const { toast } = useToast();
  const [storedWallet, setStoredWallet] = useState(initialStoredWallet);
  const [state, dispatch] = useReducer(assetReducer, initialState);
  const [dialogState, setDialogState] = useState<{ type: 'send' | 'receive' | 'opt-in' | 'reveal-mnemonic' | null, assetId?: number }>({ type: null });
  const pendingFetchesRef = useRef<Record<number, AbortController>>({});
  const network: Network = storedWallet.net;
  const [showQr, setShowQr] = useState(false);
  const isMountedRef = useRef(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState(storedWallet.label);

  /* ---------------- fetchAssetMetadata (staggered) ---------------- */
  const fetchAssetMetadata = useCallback(async (assetId: number) => {
    try {
      if (pendingFetchesRef.current[assetId]) {
        pendingFetchesRef.current[assetId].abort();
      }
      const ac = new AbortController();
      pendingFetchesRef.current[assetId] = ac;

      const cached = await getCachedAsset(assetId);
      if (cached) {
        if (ac.signal.aborted) return;
        dispatch({ type: 'UPDATE_ASSET_METADATA', payload: { assetId, metadata: cached } });
        return;
      }

      const metadata = await classifyAsset(assetId, network);
      if (ac.signal.aborted) return;
      
      await setCachedAsset(assetId, metadata);
      dispatch({ type: 'UPDATE_ASSET_METADATA', payload: { assetId, metadata } });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error(`Failed to fetch metadata for asset ${assetId}:`, e);
    } finally {
      delete pendingFetchesRef.current[assetId];
    }
  }, [network]);

  /* ------------------------- refreshData ------------------------- */
  const refreshData = useCallback(async (isInitialLoad = false) => {
    if (!storedWallet?.address) return;
    
    if (isInitialLoad) {
        dispatch({ type: 'SET_LOADING', payload: true });
    } else {
        dispatch({ type: 'SET_REFRESHING', payload: true });
    }

    try {
      const algod = getAlgodClient(network);
      const accountInfo = await algod.accountInformation(storedWallet.address).do();
      const microAlgos = accountInfo.amount;
      const algos = microalgosToAlgos(microAlgos);
      const usdBalance = await getBalanceInUsd(microAlgos);

      dispatch({ type: 'SET_ALGO_BALANCE', payload: { algo: algos, usd: usdBalance } });
      dispatch({ type: 'SET_LAST_UPDATED', payload: Date.now() });
      logEvent('ui_balance_refresh', { address: storedWallet.address, algoBalance: microAlgos, usdEquivalent: usdBalance, network });

      const assets = (accountInfo.assets || []).map((a: any) => ({ assetId: a['asset-id'], balance: BigInt(a.amount) }));
      dispatch({ type: 'MERGE_ASSETS', payload: assets });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error al actualizar datos", description: (err as Error)?.message ?? String(err) });
    } finally {
      if (isInitialLoad) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_REFRESHING', payload: false });
      }
    }
  }, [storedWallet?.address, network, toast]);

  /* -------------------- Effects & Polling ----------------------- */

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;
    let intervalId: number | undefined;

    (async () => {
      await new Promise(r => setTimeout(r, 200)); 
      if (cancelled) return;
      await refreshData(true);
      if (!cancelled) {
        intervalId = window.setInterval(() => refreshData(false), POLL_BALANCE_MS);
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      isMountedRef.current = false;
    };
  }, [refreshData, network]);

  useEffect(() => {
    const assetsToFetch = state.order.filter(id => state.byId.get(id)?.loadingMetadata);
  
    if (assetsToFetch.length > 0) {
      const staggerFetch = (index: number) => {
        if (index >= assetsToFetch.length || !isMountedRef.current) return;
        const assetId = assetsToFetch[index];
        fetchAssetMetadata(assetId);
        setTimeout(() => staggerFetch(index + 1), 50); // Stagger requests
      };
      staggerFetch(0);
    }
  
    return () => {
      // Cleanup pending fetches on component unmount or when dependencies change
      Object.values(pendingFetchesRef.current).forEach(ac => ac.abort());
      pendingFetchesRef.current = {};
    };
  }, [state.order, fetchAssetMetadata]);
  

  useEffect(() => {
    const graceChecker = window.setInterval(() => {
      const now = Date.now();
      state.byId.forEach(asset => {
        if (asset.maybeRemovedAt && now - asset.maybeRemovedAt > REMOVAL_GRACE_MS) {
          dispatch({ type: 'REMOVE_ASSET', payload: asset.id });
        }
      });
    }, POLL_BALANCE_MS / 2);

    return () => clearInterval(graceChecker);
  }, [state.byId]);

  /* --------------------------- Derived --------------------------- */

  const allAssets = Array.from(state.byId.values()).filter(a => !a.maybeRemovedAt).sort((a, b) => (state.order.indexOf(a.id) - state.order.indexOf(b.id)));
  const nfts = allAssets.filter(a => a.type === 'NFT');
  const tokens = allAssets.filter(a => a.type === 'FT');

  const allAssetsForSendDialog: AssetInfo[] = [
    {
      id: 0,
      type: 'ALGO',
      name: 'ALGO',
      decimals: 6,
      unitName: 'ALGO',
      balance: BigInt(Math.floor(state.algoBalance * 1e6)),
      net: network
    },
    ...allAssets
  ];

  /* -------------------------- Actions --------------------------- */

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(storedWallet.address);
      toast({ title: "Copiado", description: "Dirección copiada al portapapeles" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo copiar la dirección" });
    }
  };
  
  const handleSaveLabel = async () => {
    if (newLabel.trim() === '') {
        toast({ variant: 'destructive', title: 'Error', description: 'El nombre no puede estar vacío.' });
        return;
    }
    const updatedWallet = { ...storedWallet, label: newLabel.trim() };
    try {
        await saveWallet(updatedWallet);
        setStoredWallet(updatedWallet);
        setIsEditingLabel(false);
        toast({ title: 'Éxito', description: 'Nombre de la billetera actualizado.' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el nuevo nombre.' });
    }
  };

  const handleNetworkChange = async (newNetwork: Network) => {
    if (newNetwork === network) return;
    const updatedWallet = { ...storedWallet, net: newNetwork };
    try {
        dispatch({ type: 'RESET_STATE' });
        await saveWallet(updatedWallet);
        setStoredWallet(updatedWallet);
        toast({ title: 'Red Cambiada', description: `Cambiado a ${newNetwork}. Actualizando datos...` });
        logEvent('wallet_network_changed', { address: storedWallet.address, from: network, to: newNetwork });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar la red.' });
    }
  };

  const handleOpenQr = () => setShowQr(true);
  const handleCloseQr = () => setShowQr(false);

  const handleLock = () => {
    try {
      onLock();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo bloquear la wallet" });
    }
  };

  /* -------------------------- Defensive UI ---------------------- */

  if (!storedWallet) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Cargando billeteras…</p>
            <Skeleton className="h-6 w-40 mt-4 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ----------------------------- Render ------------------------- */

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        <Card className="w-full shadow-lg border-none">
          <CardHeader className="text-center relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => refreshData(false)} disabled={state.isRefreshing} aria-label="Refrescar">
                <RefreshCcw className={`h-5 w-5 ${state.isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLock} aria-label="Bloquear">
                <LogOut className="h-5 w-5 text-destructive" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-2 pt-8">
              {/* identicon safe container */}
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-2 border-primary overflow-hidden">
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: toSvg(storedWallet.address, 64) }}
                />
              </div>

              <div className="flex items-center gap-2">
                {isEditingLabel ? (
                    <Input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="text-2xl font-bold h-auto p-0 border-0 focus-visible:ring-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                    />
                ) : (
                    <CardTitle className="text-2xl font-bold">{storedWallet.label}</CardTitle>
                )}

                {isEditingLabel ? (
                    <>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500" onClick={handleSaveLabel}>
                            <Check className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setIsEditingLabel(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </>
                ) : (
                    <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Editar etiqueta" onClick={() => setIsEditingLabel(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                )}
              </div>
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex shrink min-w-0 items-center gap-2">
                      <Truncate text={storedWallet.address} />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpenQr}><Eye className="h-4 w-4" /></Button>
                  </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                              {network === 'MAINNET' ? <Globe className="h-4 w-4 text-green-500" /> : <TestTube2 className="h-4 w-4" />}
                              <span>{network}</span>
                              <ChevronDown className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleNetworkChange('MAINNET')} disabled={network === 'MAINNET'}>Mainnet</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleNetworkChange('TESTNET')} disabled={network === 'TESTNET'}>Testnet</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleNetworkChange('BETANET')} disabled={network === 'BETANET'}>Betanet</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center p-4 border rounded-lg bg-background min-h-[90px] flex flex-col justify-center">
              {state.isLoading ? (
                <div>
                  <Skeleton className="h-8 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/4 mx-auto mt-1" />
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold tracking-tight">{state.algoBalance?.toFixed(6) ?? '0.000000'} ALGO</p>
                  <p className="text-sm text-muted-foreground font-semibold">{state.usdBalance ?? '—'}</p>
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                {state.lastUpdatedAt ? `Actualizado ${formatDistanceToNowStrict(state.lastUpdatedAt, { addSuffix: true })}` : (state.isLoading || state.isRefreshing ? 'Actualizando…' : '')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setDialogState({ type: 'receive' })} variant="outline" aria-label="Recibir">
                <Download className="mr-2" />
                Recibir
              </Button>
              <Button onClick={() => setDialogState({ type: 'send' })} aria-label="Enviar">
                <Send className="mr-2" />
                Enviar
              </Button>
            </div>

            <Tabs defaultValue="tokens" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="nfts">NFTs</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="tokens" className="space-y-2 max-h-60 overflow-y-auto">
                {state.isLoading && tokens.length === 0 && Array.from({ length: 2 }).map((_, i) => <TokenRowSkeleton key={i} />)}
                {!state.isLoading && tokens.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No tienes tokens fungibles.</p>}
                {tokens.map(asset => (
                  <TokenRow key={asset.id} asset={asset} onSend={() => setDialogState({ type: 'send', assetId: asset.id })} />
                ))}
              </TabsContent>

              <TabsContent value="nfts" className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {state.isLoading && nfts.length === 0 && Array.from({ length: 3 }).map((_, i) => <NftCardSkeleton key={i} />)}
                  {!state.isLoading && nfts.length === 0 && <p className="text-center text-sm text-muted-foreground py-4 col-span-full">No tienes NFTs.</p>}
                  {nfts.map(asset => (
                    <NftCard key={asset.id} asset={asset} onSend={() => setDialogState({ type: 'send', assetId: asset.id })} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="max-h-60 overflow-y-auto">
                <TransactionHistory address={storedWallet.address} network={network} assets={state.byId} />
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setDialogState({ type: 'opt-in' })}>
                <Download className="mr-2 h-4 w-4" />
                Opt-In ASA
              </Button>
              <Button variant="outline" onClick={() => setDialogState({ type: 'reveal-mnemonic' })}>
                <Settings className="mr-2 h-4 w-4" />
                Ajustes
              </Button>
            </div>
          </CardContent>

        </Card>
      </div>

      {/* Dialogs & Modals */}
      <SendReceiveDialogs
        dialogState={dialogState}
        onClose={() => setDialogState({ type: null })}
        assets={allAssetsForSendDialog}
        fromAddress={storedWallet.address}
        onSuccess={() => refreshData(false)}
      />

      <RevealMnemonicDialog
        isOpen={dialogState.type === 'reveal-mnemonic'}
        onClose={() => setDialogState({ type: null })}
        address={storedWallet.address}
      />

      {/* QR modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleCloseQr}>
          <div className="bg-card rounded-lg p-6 w-[320px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Dirección QR</h3>
              <Button variant="ghost" size="icon" onClick={handleCloseQr}><X /></Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-md">
                <QRCode
                  value={storedWallet.address}
                  size={200}
                />
              </div>
              <p className="text-sm text-muted-foreground break-all text-center">{storedWallet.address}</p>
              <div className="flex gap-2">
                <Button onClick={handleCopyAddress}><Copy className="mr-2" /> Copiar dirección</Button>
                <Button variant="outline" onClick={handleCloseQr}>Cerrar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WalletDetailView;
