

interface CoinGeckoResponse {
  algorand: {
    usd: number;
  };
}

let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

/**
 * Fetches the current price of ALGO in USD from CoinGecko.
 * Implements a simple time-based cache to avoid excessive API calls.
 * @returns The price of 1 ALGO in USD.
 */
export async function getAlgoUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && now - cachedPrice.timestamp < CACHE_DURATION_MS) {
    return cachedPrice.price;
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
    if (!response.ok) {
      throw new Error(`CoinGecko API request failed with status ${response.status}`);
    }
    const data: CoinGeckoResponse = await response.json();
    const price = data.algorand.usd;

    cachedPrice = { price, timestamp: now };
    return price;
  } catch (error) {
    console.error("Failed to fetch ALGO price:", error);
    // Return the last known price if available, otherwise throw
    if (cachedPrice) {
      return cachedPrice.price;
    }
    throw new Error("Could not fetch ALGO price.");
  }
}

/**
 * Converts a balance in microAlgos to its USD equivalent.
 * @param microAlgos The balance in microAlgos.
 * @returns The balance formatted as a USD string (e.g., "$123.45").
 */
export async function getBalanceInUsd(microAlgos: number | bigint): Promise<string> {
  try {
    const price = await getAlgoUsdPrice();
    const algos = Number(microAlgos) / 1_000_000;
    const usdValue = algos * price;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdValue);
  } catch (error) {
    console.error("Failed to get balance in USD:", error);
    return "$--.--"; // Return a fallback value
  }
}
