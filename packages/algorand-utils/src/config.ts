import algosdk from "algosdk";

export type Network = 'MAINNET' | 'TESTNET' | 'BETANET';

interface NetworkConfig {
  NODE_API: string;
  INDEXER_API: string;
  CHAIN_ID: string;
  EXPLORER_URL: string;
  EXPLORER_ACCOUNT_URL: string;
}

const mainnetConfig: NetworkConfig = {
    NODE_API: "https://mainnet-api.algonode.cloud",
    INDEXER_API: "https://mainnet-idx.algonode.cloud",
    CHAIN_ID: "mainnet-v1.0",
    EXPLORER_URL: "https://explorer.perawallet.app/tx/",
    EXPLORER_ACCOUNT_URL: "https://explorer.perawallet.app/address/"
};

const testnetConfig: NetworkConfig = {
    NODE_API: "https://testnet-api.algonode.cloud",
    INDEXER_API: "https://testnet-idx.algonode.cloud",
    CHAIN_ID: "testnet-v1.0",
    EXPLORER_URL: "https://testnet.explorer.perawallet.app/tx/",
    EXPLORER_ACCOUNT_URL: "https://testnet.explorer.perawallet.app/address/"
};

const betanetConfig: NetworkConfig = {
    NODE_API: "https://betanet-api.algonode.cloud",
    INDEXER_API: "https://betanet-idx.algonode.cloud",
    CHAIN_ID: "betanet-v1.0",
    EXPLORER_URL: "https://betanet.explorer.perawallet.app/tx/",
    EXPLORER_ACCOUNT_URL: "https://betanet.explorer.perawallet.app/address/"
};

export const CONFIG = {
  MAINNET: mainnetConfig,
  TESTNET: testnetConfig,
  BETANET: betanetConfig,
  ACTIVE_NETWORK: (process.env.NEXT_PUBLIC_ALGO_NETWORK?.toUpperCase() || "TESTNET") as Network,
};

const algodClients: { [key: string]: algosdk.Algodv2 } = {};
const indexerClients: { [key: string]: algosdk.Indexer } = {};

export function getAlgodClient(network: Network = CONFIG.ACTIVE_NETWORK): algosdk.Algodv2 {
  if (!algodClients[network]) {
    const config = CONFIG[network];
    if (!config) {
      throw new Error(`Configuration for network "${network}" not found.`);
    }
    algodClients[network] = new algosdk.Algodv2("", config.NODE_API, "");
  }
  return algodClients[network]!;
}

export function getIndexerClient(network: Network = CONFIG.ACTIVE_NETWORK): algosdk.Indexer {
  if (!indexerClients[network]) {
     const config = CONFIG[network];
     if (!config) {
      throw new Error(`Configuration for network "${network}" not found.`);
    }
    indexerClients[network] = new algosdk.Indexer("", config.INDEXER_API, "");
  }
  return indexerClients[network]!;
}

export function getActiveConfig(): NetworkConfig {
  const activeNetwork = CONFIG.ACTIVE_NETWORK;
  switch (activeNetwork) {
    case "MAINNET":
      return CONFIG.MAINNET;
    case "BETANET":
        return CONFIG.BETANET;
    case "TESTNET":
    default:
      return CONFIG.TESTNET;
  }
}
