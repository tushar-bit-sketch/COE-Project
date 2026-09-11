import { TacticalTelemetry, WsEventType, WsMessage } from '@sentinel/shared';

type MessageHandler = (data: any) => void;

export class SentinelWsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnected = false;
  private latency = 0;

  constructor(url?: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = url || `${protocol}//${host}/ws`;
  }

  public connect(url?: string): void {
    if (url) this.url = url;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log(`[WS] Connected to ${this.url}`);
        this.triggerHandler('connection', { connected: true, url: this.url });
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          if (msg.type === 'pong') {
            const now = Date.now();
            const sent = (msg.data as any)?.clientSentTime || now;
            this.latency = Math.max(1, now - sent);
            this.triggerHandler('latency', { latencyMs: this.latency });
            return;
          }

          this.triggerHandler(msg.type, msg.data);
          this.triggerHandler('message', msg);
        } catch (e) {
          console.error('[WS] Error processing message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopPing();
        this.triggerHandler('connection', { connected: false, url: this.url });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Connection error:', err);
        this.isConnected = false;
        this.triggerHandler('error', err);
      };
    } catch (e) {
      console.warn('[WS] Connect attempt threw:', e);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      console.log('[WS] Attempting reconnection...');
      this.connect();
    }, 3000);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString(),
          data: { clientSentTime: Date.now() },
        });
      }
    }, 4000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  private triggerHandler(type: string, data: any): void {
    const set = this.handlers.get(type);
    if (set) {
      for (const h of set) {
        try {
          h(data);
        } catch (e) {
          console.error(`[WS] Handler error for '${type}':`, e);
        }
      }
    }
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public getLatency(): number {
    return this.latency;
  }
}

export const wsClient = new SentinelWsClient();
