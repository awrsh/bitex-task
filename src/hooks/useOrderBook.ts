import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderBookState, OrderBookUpdate, ConnectionStatus } from '@/types/trading';
import { OrderBookManager } from '@/lib/orderbook';
import { WebSocketManager, createWebSocketManager } from '@/lib/websocket';

export const useOrderBook = () => {
  const [state, setState] = useState<OrderBookState>({
    bids: [],
    asks: [],
    spread: 0,
    midPrice: 0,
    vwap: 0,
    lastUpdateId: 0,
    isConnected: false,
    latency: 0,
  });

  const orderBookManagerRef = useRef<OrderBookManager | null>(null);
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  const [connection, setConnection] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    latency: 0,
  });

  const handleOrderBookUpdate = useCallback((update: OrderBookUpdate) => {
    if (orderBookManagerRef.current) {
      orderBookManagerRef.current.handleUpdate(update);
    }
  }, []);

  const handleConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnection(status);
    if (orderBookManagerRef.current) {
      orderBookManagerRef.current.setConnectionStatus(status.isConnected, status.latency);
    }
  }, []);

  useEffect(() => {
    // Initialize order book manager
    orderBookManagerRef.current = new OrderBookManager(setState);
    
    // Initialize WebSocket manager with fallback
    const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@depth@100ms';
    console.log('Initializing WebSocket for OrderBook:', wsUrl);
    
    wsManagerRef.current = createWebSocketManager(
      wsUrl,
      handleOrderBookUpdate,
      (status) => {
        handleConnectionStatus(status);
      }
    );

    // Load initial snapshot and connect
    const initialize = async () => {
      try {
        if (orderBookManagerRef.current) {
          await orderBookManagerRef.current.loadSnapshot();
        }
        if (wsManagerRef.current) {
          wsManagerRef.current.connect();
        }
      } catch (error) {
        console.error('Failed to initialize order book:', error);
      }
    };

    initialize();

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
      }
    };
  }, [handleOrderBookUpdate, handleConnectionStatus]);

  const reconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
    }
  }, []);

  return {
    ...state,
    connection,
    reconnect,
    disconnect,
  };
};
