export interface Trade {
  id: number;
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  cumulative?: number;
}

export interface OrderBookSnapshot {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface OrderBookUpdate {
  e: string; // event type
  E: number; // event time
  s: string; // symbol
  U: number; // first update id in event
  u: number; // final update id in event
  b: [string, string][]; // bids
  a: [string, string][]; // asks
}

export interface OHLC {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Balances {
  usd: number;
  btc: number;
}

export interface OrderTicket {
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
}

export interface ExecutedOrder {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  cost: number;
  timestamp: number;
}

export interface OrderBookState {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
  vwap: number;
  lastUpdateId: number;
  isConnected: boolean;
  latency: number;
}

export interface ChartState {
  candles: OHLC[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: number;
  reconnectAttempts: number;
  latency: number;
}

export interface RiskValidation {
  isValid: boolean;
  error?: string;
  estimatedPrice: number;
  estimatedCost: number;
  pnlUp: number;
  pnlDown: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}
