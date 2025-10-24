import React, { useEffect, useRef } from 'react';
import { OHLC, Balances } from '@/types/trading';

// TradingView Widget Types
declare global {
  interface Window {
    TradingView: any;
  }
}

interface PriceChartProps {
  candles: OHLC[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  balances: Balances;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  candles,
  currentPrice,
  priceChange,
  priceChangePercent,
  balances,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        initializeTradingView();
      };
      document.head.appendChild(script);
    } else {
      initializeTradingView();
    }

    function initializeTradingView() {
      if (!chartContainerRef.current || !window.TradingView) return;

      // Clear existing widget
      if (widgetRef.current) {
        widgetRef.current.remove();
      }

      // Set container ID
      const containerId = `tradingview-widget-${Date.now()}`;
      chartContainerRef.current.id = containerId;
      
      // Create new TradingView widget
      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: "BINANCE:BTCUSDT",
        interval: "1",
        timezone: "Asia/Tehran",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#1a1a1a",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: containerId,
        studies: [
          "Volume@tv-basicstudies"
        ],
        overrides: {
          "paneProperties.background": "#0a0a0a",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "#1a1a1a",
          "paneProperties.horzGridProperties.color": "#1a1a1a",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor": "#ffffff",
          "scalesProperties.lineColor": "#1a1a1a"
        },
        disabled_features: [
          "use_localstorage_for_settings",
          "volume_force_overlay",
          "create_volume_indicator_by_default"
        ],
        enabled_features: [
          "side_toolbar_in_fullscreen_mode",
          "header_in_fullscreen_mode"
        ]
      });
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Handle resize
    const handleResize = () => {
      if (widgetRef.current && chartContainerRef.current) {
        widgetRef.current.resize(
          chartContainerRef.current.clientWidth, 
          Math.max(500, chartContainerRef.current.clientHeight)
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatUsd = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatBtc = (amount: number) => `${amount.toFixed(8)} BTC`;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">₿</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white leading-5">BTC/USDT</h2>
            <p className="text-slate-400 text-xs leading-4">Bitcoin / Tether - TradingView Chart</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white mb-0.5">
            {formatPrice(currentPrice)}
          </div>
          <div className="flex items-center space-x-1 justify-end">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                priceChange >= 0 
                  ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                  : 'text-red-400 bg-red-400/10 border border-red-400/20'
              }`}
            >
              {priceChange >= 0 ? '↗' : '↘'} {formatPrice(priceChange)}
            </span>
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                priceChangePercent >= 0 
                  ? 'text-green-300 bg-green-500/20' 
                  : 'text-red-300 bg-red-500/20'
              }`}
            >
              {formatPercent(priceChangePercent)}
            </span>
          </div>
          <div className="flex items-center space-x-1 justify-end mt-1">
            <span className="text-[11px] text-slate-300 bg-slate-700/40 border border-slate-600/40 rounded px-1.5 py-0.5">
              {formatUsd(balances.usd)}
            </span>
            <span className="text-[11px] text-slate-300 bg-slate-700/40 border border-slate-600/40 rounded px-1.5 py-0.5">
              {formatBtc(balances.btc)}
            </span>
          </div>
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full rounded-xl overflow-hidden flex-1 min-h-[400px] h-full"
      />
    </div>
  );
};
