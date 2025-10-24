import { useState, useEffect, useCallback, useRef } from 'react';
import { Trade, OHLC, ChartState } from '@/types/trading';
import { CandleAggregator, createCandleAggregator } from '@/lib/candles';
import { WebSocketManager, createWebSocketManager } from '@/lib/websocket';

export const useTrades = () => {
  const [state, setState] = useState<ChartState>({
    candles: [],
    currentPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
  });

  const candleAggregatorRef = useRef<CandleAggregator | null>(null);
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  const handleCandleUpdate = useCallback((candles: OHLC[]) => {
    const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
    const priceChange = candleAggregatorRef.current?.getPriceChange() || { change: 0, changePercent: 0 };
    
    setState({
      candles,
      currentPrice,
      priceChange: priceChange.change,
      priceChangePercent: priceChange.changePercent,
    });
  }, []);

  const handleTradeUpdate = useCallback((data: any) => {
    if (data.e === 'trade' && candleAggregatorRef.current) {
      const trade: Trade = {
        id: data.t,
        price: parseFloat(data.p),
        quantity: parseFloat(data.q),
        timestamp: data.T,
        isBuyerMaker: data.m,
      };
      
      candleAggregatorRef.current.addTrade(trade);
    }
  }, []);

  const handleConnectionStatus = useCallback((isConnected: boolean, latency: number) => {
    // Connection status is handled by the order book hook
  }, []);

  useEffect(() => {
    // Initialize candle aggregator
    candleAggregatorRef.current = createCandleAggregator(handleCandleUpdate);
    
    // Initialize WebSocket manager for trades
    const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@trade';
    console.log('Initializing WebSocket for Trades:', wsUrl);
    
    wsManagerRef.current = createWebSocketManager(
      wsUrl,
      handleTradeUpdate,
      handleConnectionStatus
    );

    // Connect to trades stream
    if (wsManagerRef.current) {
      wsManagerRef.current.connect();
    }

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
      }
    };
  }, [handleTradeUpdate, handleConnectionStatus, handleCandleUpdate]);

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
    reconnect,
    disconnect,
  };
};
