'use client';

import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { PriceChart } from '@/components/PriceChart';
import { OrderBook } from '@/components/OrderBook';
import { OrderTicket } from '@/components/OrderTicket';
import { ConnectionStatusComponent } from '@/components/ConnectionStatus';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useTrades } from '@/hooks/useTrades';
import { useBalances } from '@/hooks/useBalances';

export default function TradingPage() {
  const orderBook = useOrderBook();
  const trades = useTrades();
  const balances = useBalances();

  const handleShowToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  return (
    <div className=" bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white ">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border-b border-slate-600/30 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">₿</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BitEx Trading</h1>
              <p className="text-slate-400 text-sm">Professional Trading Interface</p>
            </div>
          </div>
          <ConnectionStatusComponent
            status={orderBook.connection}
            onReconnect={orderBook.reconnect}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className=" flex  p-6 gap-6 ">
        {/* Left Side - Chart and Order Ticket */}
        <div className="flex-1 flex flex-col gap-6 ">
          {/* Price Chart - Takes more space */}
          <div className="flex-[3] min-h-0">
            <PriceChart
              candles={trades.candles}
              currentPrice={trades.currentPrice}
              priceChange={trades.priceChange}
              priceChangePercent={trades.priceChangePercent}
              balances={balances.balances}
            />
          </div>

          {/* Order Ticket - Fixed height */}
          <div className="flex-[1] ">
            <OrderTicket
              balances={balances.balances}
              orderBook={{
                bids: orderBook.bids,
                asks: orderBook.asks,
              }}
              onValidateOrder={balances.validateOrder}
              onExecuteOrder={balances.executeOrder}
              onShowToast={handleShowToast}
            />
          </div>
        </div>

        {/* Right Side - Order Book with internal scroll */}
        <div className="w-96 flex-shrink-0">
          <OrderBook
            bids={orderBook.bids}
            asks={orderBook.asks}
            spread={orderBook.spread}
            midPrice={orderBook.midPrice}
            vwap={orderBook.vwap}
            isConnected={orderBook.isConnected}
            latency={orderBook.latency}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border-t border-slate-600/30 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span>Portfolio Value:</span>
              <span className="text-white font-semibold text-lg">
                ${balances.getPortfolioValue(trades.currentPrice).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-500">Data provided by Binance</span>
            <button
              onClick={balances.resetBalances}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Reset Balances
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
