import { WebSocketConfig, ConnectionStatus } from '@/types/trading';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private status: ConnectionStatus;
  private onMessage: (data: any) => void;
  private onStatusChange: (status: ConnectionStatus) => void;
  private startTime: number = 0;

  constructor(
    config: WebSocketConfig,
    onMessage: (data: any) => void,
    onStatusChange: (status: ConnectionStatus) => void
  ) {
    this.config = config;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.status = {
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      latency: 0,
    };
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.startTime = Date.now();
      console.log('Connecting to WebSocket:', this.config.url);
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.updateStatus({
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      latency: 0,
    });
  }

  public send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    
    this.updateStatus({
      isConnected: true,
      isReconnecting: false,
      lastConnected: Date.now(),
      reconnectAttempts: 0,
      latency: Date.now() - this.startTime,
    });

    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    this.clearTimers();
    this.updateStatus({
      isConnected: false,
      isReconnecting: true,
      latency: 0,
    });

    // Only reconnect if it's not a normal closure
    if (event.code !== 1000 && this.status.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('WebSocket closed permanently or max reconnection attempts reached');
      this.updateStatus({
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        latency: 0,
      });
    }
  }

  private handleError(error: Event): void {
    // In browsers, onerror provides little detail; keep logs minimal to avoid noisy consoles
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[WebSocket] error event:', error.type, 'readyState=', this.ws?.readyState);
    }
    // Mark as reconnecting and try to re-establish the connection
    this.updateStatus({
      isConnected: false,
      isReconnecting: true,
      latency: 0,
    });
    try {
      this.ws?.close();
    } catch {}
    this.ws = null;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.status.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.status.reconnectAttempts + 1})`);

    // Ensure previous socket is fully cleaned up before reconnecting
    try {
      if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
        this.ws.close();
      }
    } catch {}
    this.ws = null;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.status.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Binance WebSocket doesn't need ping, just check connection
        console.log('WebSocket heartbeat check');
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private updateStatus(newStatus: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...newStatus };
    this.onStatusChange(this.status);
  }
}

export const createWebSocketManager = (
  url: string,
  onMessage: (data: any) => void,
  onStatusChange: (status: ConnectionStatus) => void
): WebSocketManager => {
  const config: WebSocketConfig = {
    url,
    reconnectInterval: 1000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  };

  return new WebSocketManager(config, onMessage, onStatusChange);
};
