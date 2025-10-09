// packages/bridge-sdk/examples/simple-dapp.ts
import { BridgeClient } from '../dist';

async function main() {
  const bc = new BridgeClient('ws://localhost:3001');
  await bc.connect();
  const pairingRequest = {
    id: 'req-' + Date.now(),
    type: 'pairing_request',
    dapp: { name: 'Example DApp', url: 'https://example.local' },
    scopes: ['get_accounts', 'algo_sign_tx'],
    timestamp: Date.now()
  };
  bc.pairingRequest(pairingRequest);
  bc.onMessage(msg => console.log('Message from relay/wallet:', msg));
}
main().catch(console.error);
