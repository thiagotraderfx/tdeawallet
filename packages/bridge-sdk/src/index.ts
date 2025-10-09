// packages/bridge-sdk/src/index.ts
// Minimal browser-friendly SDK (isomorphic-ws).
import WebSocket from 'isomorphic-ws';
import { PairingRequest, JsonRpcRequest } from '../../../src/bridge/protocol/types';

export class BridgeClient {
  private ws?: WebSocket;
  constructor(private relayUrl: string) {}
  async connect() {
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.relayUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }
  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('not connected');
    this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
  }
  pairingRequest(req: PairingRequest) {
    this.send(req);
  }
  onMessage(cb: (m: any) => void) {
    this.ws!.onmessage = (ev) => {
      try { cb(JSON.parse(String(ev.data))); } catch(e){ cb(ev.data); }
    };
  }
  disconnect() {
    this.ws?.close();
  }
}
