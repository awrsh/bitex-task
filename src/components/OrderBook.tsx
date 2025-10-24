import React, { useState, useEffect } from 'react';
import { OrderBookLevel } from '@/types/trading';

interface OrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
  vwap: number;
  isConnected: boolean;
  latency: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  bids,
  asks,
  spread,
  midPrice,
  vwap,
  isConnected,
  latency,
}) => {
  const [animations, setAnimations] = useState<Set<string>>(new Set());

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toFixed(4);
  };

  const formatCumulative = (cumulative: number) => {
    return cumulative.toFixed(4);
  };

  const triggerAnimation = (price: number) => {
    const key = price.toString();
    setAnimations(prev => new Set(prev).add(key));
    
    setTimeout(() => {
      setAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 500);
  };

  useEffect(() => {
    // Trigger animations when prices change
    bids.slice(0, 5).forEach(bid => {
      triggerAnimation(bid.price);
    });
    asks.slice(0, 5).forEach(ask => {
      triggerAnimation(ask.price);
    });
  }, [bids, asks]);

  const getAnimationClass = (price: number) => {
    const key = price.toString();
    return animations.has(key) ? 'animate-pulse-green' : '';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 h-full  max-h-screen">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">📊</span>
          </div>
          <h2 className="text-base font-semibold text-white">Order Book</h2>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-slate-800/50 px-2 py-0.5 rounded border border-slate-600/30">
            <span className="text-slate-300">Spread: </span>
            <span className="text-white font-semibold">${spread.toFixed(2)}</span>
          </div>
          <div className="bg-slate-800/50 px-2 py-0.5 rounded border border-slate-600/30">
            <span className="text-slate-300">Mid: </span>
            <span className="text-white font-semibold">${midPrice.toFixed(2)}</span>
          </div>
          <div className="bg-slate-800/50 px-2 py-0.5 rounded border border-slate-600/30">
            <span className="text-slate-300">VWAP: </span>
            <span className="text-white font-semibold">${vwap.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto max-h-[80vh]">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 text-xs text-slate-400 font-semibold pb-3 border-b border-slate-600/30">
          <div className="text-right">Price</div>
          <div className="text-right">Size</div>
          <div className="text-right">Cumulative</div>
          <div className="text-right">%</div>
        </div>

        {/* Asks (Sell orders) - displayed first */}
        <div className="space-y-1">
          {asks.slice(0, 20).map((ask, index) => (
            <div
              key={`ask-${ask.price}`}
              className={`grid grid-cols-4 gap-4 text-xs py-2 px-3 rounded-lg transition-all duration-200 hover:bg-slate-800/30 ${getAnimationClass(ask.price)}`}
            >
              <div className="text-right text-red-400 font-mono font-semibold">
                ${formatPrice(ask.price)}
              </div>
              <div className="text-right text-white font-mono">
                {formatQuantity(ask.quantity)}
              </div>
              <div className="text-right text-slate-400 font-mono">
                {formatCumulative(ask.cumulative || 0)}
              </div>
              <div className="text-right text-slate-400 font-mono">
                {((ask.cumulative || 0) / (asks[asks.length - 1]?.cumulative || 1) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* Spread indicator */}
        <div className="flex items-center justify-center py-3 border-t border-b border-slate-600/30">
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-600/30">
            <span className="text-sm text-slate-300">
              Spread: <span className="text-white font-semibold">${spread.toFixed(2)}</span> 
              <span className="text-slate-400 ml-2">({((spread / midPrice) * 100).toFixed(3)}%)</span>
            </span>
          </div>
        </div>

        {/* Bids (Buy orders) */}
        <div className="space-y-1">
          {bids.slice(0, 20).map((bid, index) => (
            <div
              key={`bid-${bid.price}`}
              className={`grid grid-cols-4 gap-4 text-xs py-2 px-3 rounded-lg transition-all duration-200 hover:bg-slate-800/30 ${getAnimationClass(bid.price)}`}
            >
              <div className="text-right text-green-400 font-mono font-semibold">
                ${formatPrice(bid.price)}
              </div>
              <div className="text-right text-white font-mono">
                {formatQuantity(bid.quantity)}
              </div>
              <div className="text-right text-slate-400 font-mono">
                {formatCumulative(bid.cumulative || 0)}
              </div>
              <div className="text-right text-slate-400 font-mono">
                {((bid.cumulative || 0) / (bids[bids.length - 1]?.cumulative || 1) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection status */}
      <div className="mt-6 pt-4 border-t border-slate-600/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`} />
            <span className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Live Data' : 'Disconnected'}
            </span>
          </div>
          {latency > 0 && (
            <div className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-600/30">
              <span className="text-slate-300">Latency: </span>
              <span className="text-white font-semibold">{latency}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
