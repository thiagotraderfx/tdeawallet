// DApp side implementation
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { 
    generateEphemeralKeys, 
    exportKey, 
    importPublicKey, 
    deriveSharedSecret, 
    encryptPayload, 
    decryptPayload,
    base64UrlEncode,
    base64UrlDecode
} from './crypto';
import type { BridgeRequest, BridgeResponse, EncryptedPayload, SessionProposal } from './protocol';

const DEFAULT_RELAY_URL = 'ws://localhost:8080'; // Should be replaced with a production relay
const PAIRING_PROTOCOL = "tdea-ensayo";

interface DAppMetadata {
    name: string;
    url?: string;
    icon?: string;
}

export class BridgeClient extends EventEmitter {
    private relayUrl: string;
    private metadata: DAppMetadata;
    private session: {
        id: string;
        ephemeralKeys: CryptoKeyPair;
        sharedSecret: CryptoKey | null;
        walletPubKey: CryptoKey | null;
    } | null = null;
    private ws: WebSocket | null = null;
    private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
    private counters = { outgoing: 1, lastIncoming: 0 };
    
    public isConnected = false;

    constructor(metadata: DAppMetadata, relayUrl?: string) {
        super();
        this.metadata = metadata;
        this.relayUrl = relayUrl || DEFAULT_RELAY_URL;
    }

    public async connect(): Promise<{ uri: string }> {
        if (this.isConnected) {
            this.disconnect();
        }

        const sessionId = crypto.randomUUID();
        const ephemeralKeys = await generateEphemeralKeys();
        this.session = { id: sessionId, ephemeralKeys, sharedSecret: null, walletPubKey: null };

        const publicKeyB64 = base64UrlEncode(await exportKey(ephemeralKeys.publicKey));

        const params = new URLSearchParams({
            session: sessionId,
            pub: publicKeyB64,
            name: this.metadata.name,
        });
        if(this.metadata.url) params.set('url', this.metadata.url);
        if(this.metadata.icon) params.set('icon', this.metadata.icon);

        const uri = `${PAIRING_PROTOCOL}:?${params.toString()}`;
        this.emit('uri_generated', uri);

        this.setupWebSocket(sessionId);
        return { uri };
    }

    private setupWebSocket(sessionId: string) {
        const wsUrl = `${this.relayUrl}?session=${sessionId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
            console.log(`[dApp] Connected to Relay for session ${sessionId}`);
        });

        this.ws.on('message', async (data) => {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'session_proposal' || message.type === 'encrypted_response') {
                if (message.type === 'session_proposal') {
                    const payload = message.payload as SessionProposal;
                    const walletPubKeyBytes = base64UrlDecode(payload.publicKey);
                    const walletPubKey = await importPublicKey(walletPubKeyBytes);
                    this.session!.walletPubKey = walletPubKey;
    
                    const sharedSecret = await deriveSharedSecret(
                        this.session!.ephemeralKeys.privateKey,
                        walletPubKey,
                        new TextEncoder().encode(this.session!.id),
                        "tdea-bridge"
                    );
                    this.session!.sharedSecret = sharedSecret;
                    this.isConnected = true;
                    this.emit('session_established', { peer: payload });

                } else { // encrypted_response
                    try {
                        if (!this.session || !this.session.sharedSecret) return;
                        const payload = message.payload as EncryptedPayload;
                        const { decrypted, counter } = await decryptPayload<BridgeResponse>(this.session.sharedSecret, payload, this.session.id);

                        if (counter <= this.counters.lastIncoming) { throw new Error('Replay attack detected'); }
                        this.counters.lastIncoming = counter;

                        if (decrypted.id === 'session_accept') {
                            this.emit('session_accepted', decrypted.result);
                            return;
                        }
    
                        const pending = this.pendingRequests.get(decrypted.id);
                        if (pending) {
                            if (decrypted.error) {
                                pending.reject(decrypted.error);
                            } else {
                                pending.resolve(decrypted.result);
                            }
                            this.pendingRequests.delete(decrypted.id);
                        }
                    } catch (error) {
                        console.error('[dApp] Decryption failed:', error);
                        this.emit('error', error);
                    }
                }
            }
        });

        this.ws.on('close', () => {
            this.isConnected = false;
            this.emit('session_disconnected');
        });
        
        this.ws.on('error', (error) => {
            console.error('[dApp] WebSocket error:', error);
            this.emit('error', error);
        });
    }
    
    private async sendRequest(method: string, params: any): Promise<any> {
        if (!this.isConnected || !this.ws || !this.session?.sharedSecret) {
            throw new Error('Not connected to wallet.');
        }

        const id = crypto.randomUUID();
        const request: BridgeRequest = { id, method, params };
        
        const counter = this.counters.outgoing++;
        const senderPubKeyB64 = base64UrlEncode(await exportKey(this.session.ephemeralKeys.publicKey));
        
        const { ciphertext, iv } = await encryptPayload(
            this.session.sharedSecret,
            request,
            this.session.id,
            senderPubKeyB64,
            counter
        );

        this.ws.send(JSON.stringify({
            type: 'encrypted_request',
            payload: {
                iv: base64UrlEncode(iv),
                ct: base64UrlEncode(new Uint8Array(ciphertext)),
                counter,
                senderPub: senderPubKeyB64
            }
        }));

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
        });
    }

    public async requestAccounts(): Promise<{ accounts: string[] }> {
        return this.sendRequest('request_accounts', {});
    }

    public async signTransactions(txns: string[]): Promise<{ signedTxns: string[] }> {
        return this.sendRequest('sign_transactions', { txs: txns });
    }

    public disconnect() {
        this.ws?.close();
        this.session = null;
        this.isConnected = false;
        this.pendingRequests.forEach(p => p.reject('Session disconnected.'));
        this.pendingRequests.clear();
    }
}
