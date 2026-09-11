import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  WsEventType,
  WsMessage,
  TacticalTelemetry,
} from '@sentinel/shared';
import { trackingService } from '../services/tracking.service.js';

export class SentinelWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress;
      this.clients.add(ws);
      console.log(`[WS] Client connected from ${clientIp}. Active clients: ${this.clients.size}`);

      // Immediately send current telemetry state on connect
      const currentTelemetry = trackingService.getLatestTelemetry();
      if (currentTelemetry) {
        this.sendToClient(ws, {
          type: WsEventType.TELEMETRY_TICK,
          timestamp: new Date().toISOString(),
          data: { telemetry: currentTelemetry },
        });
      }

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsed);
        } catch (e) {
          console.error('[WS] Failed to parse client message:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WS] Client disconnected. Active clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WS] Client error:', err);
        this.clients.delete(ws);
      });
    });

    // Subscribe to tracking service events
    trackingService.onTelemetry((telemetry: TacticalTelemetry) => {
      this.broadcast({
        type: WsEventType.TELEMETRY_TICK,
        timestamp: new Date().toISOString(),
        data: { telemetry },
      });
    });

    trackingService.onEvent((type: string, payload: unknown) => {
      this.broadcast({
        type,
        timestamp: new Date().toISOString(),
        data: payload,
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          timestamp: new Date().toISOString(),
          data: { latencyMs: 1 },
        });
        break;

      case 'target:lock':
        if (typeof message.targetId === 'number' || message.targetId === null) {
          trackingService.setLock(message.targetId);
        }
        break;

      case 'simulation:control':
        if (message.action === 'SCENARIO' && message.scenario) {
          trackingService.setSimulationScenario(message.scenario);
        } else if (message.action === 'SPEED' && typeof message.speed === 'number') {
          trackingService.setSimulationSpeed(message.speed);
        } else if (message.action === 'RESET') {
          trackingService.resetSimulation();
        } else if (message.action === 'PAUSE' || message.action === 'TOGGLE_PAUSE') {
          trackingService.toggleSimulationPause();
        }
        break;

      case 'alarm:acknowledge':
        if (message.alertId) {
          trackingService.getAlertService().acknowledgeAlert(message.alertId, message.operator || 'operator');
        }
        break;

      case 'client:detections':
        // If client is running local browser COCO-SSD and feeding detections to server
        if (Array.isArray(message.detections)) {
          trackingService.tick(message.detections);
        }
        break;

      default:
        console.log(`[WS] Unknown client message type: ${message.type}`);
    }
  }

  public broadcast(message: WsMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private sendToClient(ws: WebSocket, message: WsMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }
}
