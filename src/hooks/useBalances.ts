import { useState, useCallback, useEffect, useRef } from 'react';
import { Balances, OrderTicket, RiskValidation, OrderBookLevel, ExecutedOrder } from '@/types/trading';
import { RiskManager, createRiskManager } from '@/lib/risk';

export const useBalances = () => {
  const [balances, setBalances] = useState<Balances>({
    usd: 10000,
    btc: 0.25,
  });

  const riskManagerRef = useRef<RiskManager | null>(null);
  const [orders, setOrders] = useState<ExecutedOrder[]>([]);

  const handleBalanceChange = useCallback((newBalances: Balances) => {
    setBalances(newBalances);
  }, []);

  useEffect(() => {
    riskManagerRef.current = createRiskManager(balances, handleBalanceChange);
  }, [balances, handleBalanceChange]);

  // Load persisted orders once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('bitex:orders');
      if (raw) {
        const parsed: ExecutedOrder[] = JSON.parse(raw);
        setOrders(parsed);
      }
    } catch {}
  }, []);

  const persistOrders = useCallback((next: ExecutedOrder[]) => {
    setOrders(next);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bitex:orders', JSON.stringify(next));
      }
    } catch {}
  }, []);

  const validateOrder = useCallback((
    order: OrderTicket,
    orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }
  ): RiskValidation => {
    if (riskManagerRef.current) {
      return riskManagerRef.current.validateOrder(order, orderBook);
    }
    return {
      isValid: false,
      error: 'Risk manager not initialized',
      estimatedPrice: 0,
      estimatedCost: 0,
      pnlUp: 0,
      pnlDown: 0,
    };
  }, []);

  const executeOrder = useCallback((order: OrderTicket, estimatedPrice: number): boolean => {
    if (!riskManagerRef.current) return false;
    const ok = riskManagerRef.current.executeOrder(order, estimatedPrice);
    if (ok) {
      const fill: ExecutedOrder = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        side: order.side,
        quantity: order.quantity,
        price: estimatedPrice,
        cost: order.quantity * estimatedPrice,
        timestamp: Date.now(),
      };
      persistOrders([fill, ...orders].slice(0, 500));
    }
    return ok;
  }, [orders, persistOrders]);

  const clearOrders = useCallback(() => {
    persistOrders([]);
  }, [persistOrders]);

  const getPortfolioValue = useCallback((currentPrice: number): number => {
    if (riskManagerRef.current) {
      return riskManagerRef.current.getPortfolioValue(currentPrice);
    }
    return balances.usd + (balances.btc * currentPrice);
  }, [balances]);

  const getPortfolioChange = useCallback((
    initialPrice: number,
    currentPrice: number
  ): { change: number; changePercent: number } => {
    if (riskManagerRef.current) {
      return riskManagerRef.current.getPortfolioChange(initialPrice, currentPrice);
    }
    return { change: 0, changePercent: 0 };
  }, []);

  const resetBalances = useCallback(() => {
    if (riskManagerRef.current) {
      riskManagerRef.current.resetBalances();
    }
  }, []);

  return {
    balances,
    orders,
    validateOrder,
    executeOrder,
    clearOrders,
    getPortfolioValue,
    getPortfolioChange,
    resetBalances,
  };
};
