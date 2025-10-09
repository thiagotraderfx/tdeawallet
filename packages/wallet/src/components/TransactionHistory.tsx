"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getTransactions, type Transaction, logEvent, microalgosToAlgos } from '@tdea/algorand-utils';
import { Loader, AlertCircle, ArrowUpRight, ArrowDownLeft, FilePlus, RefreshCcw, ExternalLink } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Truncate } from "@/components/ui/truncate";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AssetInfo } from './wallet-detail-view';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransactionHistoryProps {
  address: string;
  assets: Map<number, AssetInfo>;
  network: 'MAINNET' | 'TESTNET' | 'BETANET';
}

const TxRow = ({ tx, currentUserAddress, assetInfo, network }: { tx: Transaction, currentUserAddress: string, assetInfo?: AssetInfo, network: 'MAINNET' | 'TESTNET' | 'BETANET' }) => {
  const isSender = tx.from === currentUserAddress;
  const roundTime = tx.timestamp ? tx.timestamp * 1000 : Date.now();
  const otherParty = isSender ? tx.to : tx.from;
  const explorerUrl = `https://${network === 'TESTNET' ? 'testnet.' : ''}explorer.perawallet.app/tx/${tx.id}`;

  useEffect(() => {
    logEvent('ui_tx_history_render', {
        txId: tx.id,
        type: tx.type,
        assetId: tx.assetId,
        assetName: assetInfo?.name,
        amount: tx.amount?.toString()
    });
  }, [tx, assetInfo]);

  const renderIconAndTitle = () => {
    switch (tx.type) {
      case 'pay':
        return isSender
          ? { icon: <ArrowUpRight className="text-red-500" />, title: "Envío" }
          : { icon: <ArrowDownLeft className="text-green-500" />, title: "Recepción" };
      case 'axfer':
         const isOptIn = tx.amount === 0 && tx.to === tx.from;
        if(isOptIn) return { icon: <FilePlus className="text-gray-500" />, title: `Opt-In` };

        return isSender
          ? { icon: <ArrowUpRight className="text-red-500" />, title: "Envío" }
          : { icon: <ArrowDownLeft className="text-green-500" />, title: "Recepción" };
      default:
        return { icon: <FilePlus className="text-gray-500" />, title: `App Call` };
    }
  };
  
  const getAmountInfo = () => {
    if (tx.type === 'pay' && tx.amount) {
      const algoAmount = microalgosToAlgos(tx.amount);
      return { amount: `${isSender ? '-' : '+'} ${algoAmount.toFixed(6)}`, unit: 'ALGO' };
    }
    if (tx.type === 'axfer' && tx.assetId && assetInfo) {
      const amount = Number(tx.amount);
      if (amount === 0 && isSender) return { amount: '0', unit: assetInfo?.unitName || assetInfo?.name || `Asset` };
      
      const displayAmount = assetInfo.decimals ? amount / (10 ** assetInfo.decimals) : amount;
      
      if (assetInfo.type === 'NFT') {
        return { amount: '1', unit: `${assetInfo.name}` };
      }
      
      return { 
        amount: `${isSender ? '-' : '+'} ${displayAmount.toLocaleString(undefined, { maximumFractionDigits: assetInfo.decimals })}`, 
        unit: `${assetInfo.name}`
      };
    }
     if (tx.type === 'axfer' && tx.assetId) {
        return { amount: `${isSender ? '-' : '+'}${tx.amount}`, unit: `Asset-${tx.assetId}` }
     }
    return { amount: null, unit: null };
  };

  const { icon, title } = renderIconAndTitle();
  const { amount, unit } = getAmountInfo();

  return (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-2" title={title}>
                {icon}
                <span className="hidden md:inline">{title}</span>
            </div>
        </TableCell>
        <TableCell className={`font-mono font-semibold ${isSender ? 'text-red-500' : 'text-green-500'}`}>{amount}</TableCell>
        <TableCell className="font-medium">
             <Truncate text={unit || '-'} startChars={10} endChars={0} showCopy={false}/>
        </TableCell>
        <TableCell>
            {otherParty && <Truncate text={otherParty} startChars={4} endChars={4} showCopy={true} />}
        </TableCell>
        <TableCell>
             <a href={explorerUrl} target="_blank" rel="noopener noreferrer" title="Ver en explorador" className='flex items-center gap-1 text-primary hover:underline'>
                <Truncate text={tx.id} startChars={4} endChars={4} showCopy={true} />
                <ExternalLink className="h-3 w-3" />
            </a>
        </TableCell>
        <TableCell>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        {formatDistanceToNow(roundTime, { addSuffix: true, locale: es })}
                    </TooltipTrigger>
                    <TooltipContent>
                        {format(roundTime, 'PPP p', { locale: es })}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </TableCell>
    </TableRow>
  )
};

export function TransactionHistory({ address, assets, network }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchTransactions = useCallback(async (isInitialLoad = false) => {
    if (!hasMore && !isInitialLoad) return;
    setIsLoading(true);
    if(isInitialLoad) {
        setTransactions([]);
        setNextToken(undefined);
        setHasMore(true);
    }
    
    try {
      const response = await getTransactions(address, 25, isInitialLoad ? undefined : nextToken, network);
      const newTransactions = response.txs || [];
      
      setTransactions(prev => isInitialLoad ? newTransactions : [...prev, ...newTransactions]);
      setNextToken(response.next);
      setHasMore(!!response.next);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      logEvent('ui_tx_history_error', { address, error: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [address, nextToken, hasMore, network]);

  useEffect(() => {
    fetchTransactions(true);
  }, [address, network]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          fetchTransactions();
        }
      },
      { threshold: 1.0 }
    );
    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [fetchTransactions, isLoading, hasMore]);


  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  if (error && transactions.length === 0) {
    return (
        <div className="text-center py-4 text-sm text-destructive flex flex-col items-center gap-2">
            <AlertCircle />
            <p>{error}</p>
            <Button variant="link" onClick={() => fetchTransactions(true)}>
                <RefreshCcw className="mr-2 h-4 w-4"/>
                Reintentar
            </Button>
        </div>
    );
  }

  if (transactions.length === 0 && !isLoading) {
    return <p className="text-center py-4 text-sm text-muted-foreground">No hay transacciones todavía.</p>;
  }

  return (
    <div className="overflow-x-auto">
       <Table className="min-w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Contraparte</TableHead>
                    <TableHead>Tx ID</TableHead>
                    <TableHead>Tiempo</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map(tx => (
                    <TxRow 
                        key={tx.id} 
                        tx={tx} 
                        currentUserAddress={address} 
                        assetInfo={tx.assetId ? assets.get(tx.assetId) : undefined} 
                        network={network}
                    />
                ))}
            </TableBody>
       </Table>
      <div ref={loaderRef} className="h-1">
        {isLoading && hasMore && <div className="flex justify-center py-2"><Loader className="animate-spin" /></div>}
      </div>
    </div>
  );
}
