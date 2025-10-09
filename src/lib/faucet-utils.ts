import algosdk from 'algosdk';

async function getFaucetBalance(): Promise<string> {
  const ALGO_MNEMONIC = process.env.ALGO_MNEMONIC;
  if (!ALGO_MNEMONIC) {
    console.warn(
      'Faucet balance check skipped: ALGO_MNEMONIC not configured.'
    );
    return '0.000000';
  }

  try {
    const algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );
    const faucetAccount = algosdk.mnemonicToSecretKey(ALGO_MNEMONIC);
    const accountInfo = await algodClient
      .accountInformation(faucetAccount.addr)
      .do();
    const balance = accountInfo.amount;
    return (balance / 1_000_000).toFixed(6);
  } catch (error) {
    console.error('Failed to get faucet balance:', error);
    return '0.000000'; // Return a safe value on error
  }
}

export { getFaucetBalance };
