'use server';

import { getIndexerClient, type Network } from '../config';
import { logEvent } from '../logger';
import { resolveIpfsUrl } from './ipfs';

export type AssetType = 'ALGO' | 'FT' | 'NFT';
export type NftStandard = 'ARC3' | 'ARC69' | 'ARC19' | 'GENERIC';

export interface ClassifiedAsset {
  id: number;
  type: AssetType;
  standard?: NftStandard;
  name: string;
  unitName?: string;
  decimals: number;
  url?: string;
  imageUrl?: string | null;
  net: Network;
  // Extended properties
  balance?: bigint;
  frozen?: boolean;
}

/**
 * Clasifica un activo de Algorand basado en sus parámetros.
 * @param assetId - El ID del activo de Algorand.
 * @returns Un objeto ClassifiedAsset normalizado.
 */
export async function classifyAsset(assetId: number, network: Network): Promise<ClassifiedAsset> {
  try {
    const indexer = getIndexerClient(network);
    const assetInfo = await indexer.lookupAssetByID(assetId).do();
    const params = assetInfo.asset.params;
    logEvent('asa_metadata_resolved', { assetId, name: params.name, url: params.url, network });

    let creationNoteJson: Record<string, any> | null = null;
    try {
      const txs = await indexer
        .searchForTransactions()
        .assetID(assetId)
        .txType('acfg')
        .limit(1)
        .do();
      if (txs.transactions?.length && txs.transactions[0].note) {
        const noteB64 = txs.transactions[0].note;
        const noteStr = Buffer.from(noteB64, 'base64').toString('utf8');
        if (noteStr.trim().startsWith('{')) {
          creationNoteJson = JSON.parse(noteStr);
        }
      }
    } catch (noteError) {
      // Ignore errors fetching or parsing the creation note
    }

    let standard: NftStandard | undefined;
    let reason = 'fallback';
    let isNFT = false;

    // Strict NFT checks first: total supply of 1 and 0 decimals is the definition of a pure NFT.
    if (params.total === 1 && params.decimals === 0) {
        isNFT = true;
        standard = 'GENERIC'; // Default to GENERIC for NFTs
        reason = 'total=1, decimals=0';

        if (params['metadata-hash']) {
          standard = 'ARC3';
          reason = 'metadata-hash present';
        } else if (params.url?.endsWith('#arc3')) {
          standard = 'ARC3';
          reason = 'url ends with #arc3';
        } else if (creationNoteJson && (creationNoteJson.image || creationNoteJson.name || creationNoteJson.properties)) {
          standard = 'ARC69';
          reason = 'valid creation note found';
        } else if (params.url?.includes('template-ipfs')) {
          standard = 'ARC19';
          reason = 'template-ipfs found in url';
        }
    }

    const type: AssetType = isNFT ? 'NFT' : 'FT';
    logEvent('ui_asset_classified', { assetId, type, standard, reason });
    
    let name = params.name || `Asset #${assetId}`;
    let metadataUrl = params.url;
    let imageUrl: string | null = null;

    if (type === 'NFT') {
      try {
        if (standard === 'ARC69' && creationNoteJson) {
           name = creationNoteJson.name || name;
           if (creationNoteJson.image) {
              metadataUrl = creationNoteJson.image;
           } else if (creationNoteJson.url) {
              metadataUrl = creationNoteJson.url;
           }
        }

        if (metadataUrl) {
          const resolvedUrl = resolveIpfsUrl(metadataUrl);
          if (resolvedUrl?.endsWith('.json')) {
            logEvent('ui_asset_metadata_fetch', { assetId, triedUrl: resolvedUrl, status: 'attempt' });
            const response = await fetch(resolvedUrl, { signal: AbortSignal.timeout(3000) });
            if (response.ok) {
              const metadata = await response.json();
              const imageField = metadata.image || metadata.image_url || metadata.media_url || metadata.artifactUri || metadata.displayUri;
              if (imageField) {
                imageUrl = resolveIpfsUrl(imageField);
              }
              if (metadata.name) name = metadata.name;
              logEvent('ui_asset_metadata_fetch', { assetId, triedUrl: resolvedUrl, status: 'success' });
            } else {
              logEvent('ui_asset_metadata_fetch', { assetId, triedUrl: resolvedUrl, status: 'failed' });
            }
          } else if (resolvedUrl) {
            imageUrl = resolvedUrl;
          }
        }
      } catch (e: any) {
        logEvent('ui_asset_metadata_fetch', { assetId, reason: e.message, status: 'exception' });
      }
    }
    
    return {
      id: assetId,
      type: type,
      standard: standard,
      name: name,
      unitName: params['unit-name'],
      decimals: params.decimals,
      url: params.url,
      imageUrl: imageUrl,
      net: network,
    };
  } catch (error: any) {
    return {
        id: assetId,
        type: 'FT',
        name: `Asset #${assetId}`,
        decimals: 0,
        unitName: '',
        net: network,
    }
  }
}
