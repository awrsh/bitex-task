import { RiskManager, createRiskManager } from '@/lib/risk';
import { Balances, OrderTicket, OrderBookLevel } from '@/types/trading';

describe('RiskManager', () => {
  let riskManager: RiskManager;
  let mockOnBalanceChange: jest.Mock;
  let initialBalances: Balances;

  beforeEach(() => {
    mockOnBalanceChange = jest.fn();
    initialBalances = {
      usd: 10000,
      btc: 0.25,
    };
    riskManager = new RiskManager(initialBalances, mockOnBalanceChange);
  });

  describe('validateOrder', () => {
    const mockOrderBook = {
      bids: [{ price: 50000, quantity: 1.0, cumulative: 1.0 }],
      asks: [{ price: 50001, quantity: 1.0, cumulative: 1.0 }],
    };

    it('should validate buy order with sufficient balance', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: 0.1,
      };

      const validation = riskManager.validateOrder(order, mockOrderBook);

      expect(validation.isValid).toBe(true);
      expect(validation.estimatedPrice).toBe(50001);
      expect(validation.estimatedCost).toBe(5000.1);
      expect(validation.pnlUp).toBeGreaterThan(0);
      expect(validation.pnlDown).toBeLessThan(0);
    });

    it('should validate sell order with sufficient balance', () => {
      const order: OrderTicket = {
        side: 'sell',
        quantity: 0.1,
      };

      const validation = riskManager.validateOrder(order, mockOrderBook);

      expect(validation.isValid).toBe(true);
      expect(validation.estimatedPrice).toBe(50000);
      expect(validation.estimatedCost).toBe(5000);
    });

    it('should reject buy order with insufficient USD balance', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: 1.0, // Would cost $50,001 but only have $10,000
      };

      const validation = riskManager.validateOrder(order, mockOrderBook);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Insufficient USD balance');
    });

    it('should reject sell order with insufficient BTC balance', () => {
      const order: OrderTicket = {
        side: 'sell',
        quantity: 1.0, // Only have 0.25 BTC
      };

      const validation = riskManager.validateOrder(order, mockOrderBook);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Insufficient BTC balance');
    });

    it('should reject order with zero quantity', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: 0,
      };

      const validation = riskManager.validateOrder(order, mockOrderBook);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Quantity must be greater than 0');
    });

    it('should reject order with negative quantity', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: -0.1,
      };

      const validation = riskManager.validateOrder(order, mockOrderBook);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Quantity must be greater than 0');
    });

    it('should handle missing market data', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: 0.1,
      };

      const validation = riskManager.validateOrder(order, { bids: [], asks: [] });

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('No market data available');
    });
  });

  describe('executeOrder', () => {
    const mockOrderBook = {
      bids: [{ price: 50000, quantity: 1.0, cumulative: 1.0 }],
      asks: [{ price: 50001, quantity: 1.0, cumulative: 1.0 }],
    };

    it('should execute valid buy order', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: 0.1,
      };

      const success = riskManager.executeOrder(order, 50001);

      expect(success).toBe(true);
      expect(mockOnBalanceChange).toHaveBeenCalledWith({
        usd: 4999.9, // 10000 - 5000.1
        btc: 0.35, // 0.25 + 0.1
      });
    });

    it('should execute valid sell order', () => {
      const order: OrderTicket = {
        side: 'sell',
        quantity: 0.1,
      };

      const success = riskManager.executeOrder(order, 50000);

      expect(success).toBe(true);
      expect(mockOnBalanceChange).toHaveBeenCalledWith({
        usd: 15000, // 10000 + 5000
        btc: 0.15, // 0.25 - 0.1
      });
    });

    it('should not execute invalid order', () => {
      const order: OrderTicket = {
        side: 'buy',
        quantity: 1.0, // Insufficient balance
      };

      const success = riskManager.executeOrder(order, 50001);

      expect(success).toBe(false);
      expect(mockOnBalanceChange).not.toHaveBeenCalled();
    });
  });

  describe('getBalances', () => {
    it('should return current balances', () => {
      const balances = riskManager.getBalances();
      expect(balances).toEqual(initialBalances);
    });
  });

  describe('setBalances', () => {
    it('should update balances and notify', () => {
      const newBalances: Balances = {
        usd: 15000,
        btc: 0.5,
      };

      riskManager.setBalances(newBalances);

      expect(mockOnBalanceChange).toHaveBeenCalledWith(newBalances);
      expect(riskManager.getBalances()).toEqual(newBalances);
    });
  });

  describe('resetBalances', () => {
    it('should reset to initial balances', () => {
      // First change balances
      riskManager.setBalances({ usd: 5000, btc: 0.1 });
      
      // Then reset
      riskManager.resetBalances();

      expect(mockOnBalanceChange).toHaveBeenCalledWith({
        usd: 10000,
        btc: 0.25,
      });
    });
  });

  describe('getPortfolioValue', () => {
    it('should calculate portfolio value correctly', () => {
      const portfolioValue = riskManager.getPortfolioValue(50000);
      expect(portfolioValue).toBe(22500); // 10000 + (0.25 * 50000)
    });
  });

  describe('getPortfolioChange', () => {
    it('should calculate portfolio change correctly', () => {
      const change = riskManager.getPortfolioChange(40000, 50000);
      expect(change.change).toBe(2500); // (0.25 * 50000) - (0.25 * 40000)
      expect(change.changePercent).toBe(25); // (2500 / 10000) * 100
    });

    it('should handle zero initial value', () => {
      const change = riskManager.getPortfolioChange(0, 50000);
      expect(change.changePercent).toBe(0);
    });
  });

  describe('createRiskManager', () => {
    it('should create risk manager with callback', () => {
      const manager = createRiskManager(initialBalances, mockOnBalanceChange);
      expect(manager).toBeInstanceOf(RiskManager);
    });
  });
});
