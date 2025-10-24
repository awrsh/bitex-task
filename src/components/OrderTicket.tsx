import React, { useState, useCallback } from 'react';
import { OrderTicket as OrderTicketType, RiskValidation, Balances } from '@/types/trading';
import { OrderBookLevel } from '@/types/trading';

interface OrderTicketProps {
  balances: Balances;
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] };
  onValidateOrder: (order: OrderTicketType, orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }) => RiskValidation;
  onExecuteOrder: (order: OrderTicketType, estimatedPrice: number) => boolean;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  balances,
  orderBook,
  onValidateOrder,
  onExecuteOrder,
  onShowToast,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('');
  const [validation, setValidation] = useState<RiskValidation | null>(null);

  const handleQuantityChange = useCallback((value: string) => {
    setQuantity(value);
    
    const numQuantity = parseFloat(value);
    if (numQuantity > 0) {
      const order: OrderTicketType = {
        side,
        quantity: numQuantity,
        orderType: 'market',
      };
      
      try {
        const validationResult = onValidateOrder(order, orderBook);
        setValidation(validationResult);
      } catch (error) {
        console.error('Validation error:', error);
        setValidation(null);
      }
    } else {
      setValidation(null);
    }
  }, [side, orderBook, onValidateOrder]);

  const handleSideChange = useCallback((newSide: 'buy' | 'sell') => {
    setSide(newSide);
    
    const numQuantity = parseFloat(quantity);
    if (numQuantity > 0) {
      const order: OrderTicketType = {
        side: newSide,
        quantity: numQuantity,
      };
      
      const validationResult = onValidateOrder(order, orderBook);
      setValidation(validationResult);
    }
  }, [quantity, orderBook, onValidateOrder]);

  const handlePlaceOrder = useCallback(() => {
    const numQuantity = parseFloat(quantity);
    if (numQuantity <= 0) {
      onShowToast('Please enter a valid quantity', 'error');
      return;
    }

    const order: OrderTicketType = {
      side,
      quantity: numQuantity,
    };

    const validationResult = onValidateOrder(order, orderBook);
    if (!validationResult.isValid) {
      onShowToast(validationResult.error || 'Invalid order', 'error');
      return;
    }

    const success = onExecuteOrder(order, validationResult.estimatedPrice);
    if (success) {
      onShowToast(
        `${side.toUpperCase()} order placed: ${numQuantity} BTC at $${validationResult.estimatedPrice.toFixed(2)}`,
        'success'
      );
      setQuantity('');
      setValidation(null);
    } else {
      onShowToast('Failed to place order', 'error');
    }
  }, [side, quantity, orderBook, onValidateOrder, onExecuteOrder, onShowToast]);

  const formatBalance = (balance: number, currency: string) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(balance);
    }
    return `${balance.toFixed(8)} ${currency}`;
  };

  const getBestPrice = () => {
    if (side === 'buy') {
      return orderBook.asks[0]?.price || 0;
    }
    return orderBook.bids[0]?.price || 0;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">📝</span>
        </div>
        <h2 className="text-xl font-bold text-white">Order Ticket</h2>
      </div>
      
      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-background rounded p-3">
          <div className="text-sm text-neutral-400">USD Balance</div>
          <div className="text-lg font-semibold text-white">
            {formatBalance(balances.usd, 'USD')}
          </div>
        </div>
        <div className="bg-background rounded p-3">
          <div className="text-sm text-neutral-400">BTC Balance</div>
          <div className="text-lg font-semibold text-white">
            {formatBalance(balances.btc, 'BTC')}
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="space-y-4">
        {/* Side Selection */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleSideChange('buy')}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-background text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => handleSideChange('sell')}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-background text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm text-neutral-400 mb-2">
            Quantity (BTC)
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="0.00000000"
            step="0.00000001"
            min="0"
            className="w-full px-3 py-2 bg-background border border-border rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Order Summary */}
        {validation && (
          <div className="bg-background rounded p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Estimated Price:</span>
              <span className="text-white">
                ${validation.estimatedPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Estimated Cost:</span>
              <span className="text-white">
                ${validation.estimatedCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">PnL (+0.5%):</span>
              <span className="text-green-400">
                ${validation.pnlUp.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">PnL (-0.5%):</span>
              <span className="text-red-400">
                ${validation.pnlDown.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {validation && !validation.isValid && (
          <div className="text-red-400 text-sm">
            {validation.error}
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={!validation?.isValid || !quantity}
          className={`w-full py-3 px-4 rounded font-medium transition-colors ${
            validation?.isValid && quantity
              ? side === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Place {side.toUpperCase()} Order
        </button>
      </div>
    </div>
  );
};
