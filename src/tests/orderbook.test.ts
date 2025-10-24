import { OrderBookManager } from '@/lib/orderbook';
import { OrderBookUpdate } from '@/types/trading';

describe('OrderBookManager', () => {
  let orderBookManager: OrderBookManager;
  let mockOnStateChange: jest.Mock;

  beforeEach(() => {
    mockOnStateChange = jest.fn();
    orderBookManager = new OrderBookManager(mockOnStateChange);
  });

  describe('loadSnapshot', () => {
    it('should load initial snapshot successfully', async () => {
      // Mock fetch response
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          lastUpdateId: 100,
          bids: [['50000', '1.5'], ['49999', '2.0']],
          asks: [['50001', '1.0'], ['50002', '1.5']],
        }),
      });

      await orderBookManager.loadSnapshot();

      expect(mockOnStateChange).toHaveBeenCalled();
      const state = orderBookManager.getState();
      expect(state.bids).toHaveLength(2);
      expect(state.asks).toHaveLength(2);
      expect(state.lastUpdateId).toBe(100);
    });

    it('should handle fetch errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(orderBookManager.loadSnapshot()).rejects.toThrow('Network error');
    });
  });

  describe('handleUpdate', () => {
    beforeEach(async () => {
      // Load initial snapshot
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          lastUpdateId: 100,
          bids: [['50000', '1.5']],
          asks: [['50001', '1.0']],
        }),
      });
      await orderBookManager.loadSnapshot();
    });

    it('should apply valid updates', () => {
      const update: OrderBookUpdate = {
        e: 'depthUpdate',
        E: 1234567890,
        s: 'BTCUSDT',
        U: 101,
        u: 101,
        b: [['49999', '2.0']],
        a: [['50002', '1.5']],
      };

      orderBookManager.handleUpdate(update);

      const state = orderBookManager.getState();
      expect(state.lastUpdateId).toBe(101);
    });

    it('should handle sequence mismatch', async () => {
      const update: OrderBookUpdate = {
        e: 'depthUpdate',
        E: 1234567890,
        s: 'BTCUSDT',
        U: 102, // Wrong sequence
        u: 102,
        b: [],
        a: [],
      };

      // Mock reload
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          lastUpdateId: 102,
          bids: [['50000', '1.5']],
          asks: [['50001', '1.0']],
        }),
      });

      orderBookManager.handleUpdate(update);

      // Should trigger reload
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('mergeLevels', () => {
    it('should merge bid levels correctly', () => {
      const existing = [
        { price: 50000, quantity: 1.5 },
        { price: 49999, quantity: 2.0 },
      ];
      const updates = [
        { price: 49999, quantity: 0 }, // Remove
        { price: 49998, quantity: 1.0 }, // Add new
      ];

      const result = (orderBookManager as any).mergeLevels(existing, updates, 'bids');
      
      expect(result).toHaveLength(2);
      expect(result.find(l => l.price === 49999)).toBeUndefined();
      expect(result.find(l => l.price === 49998)?.quantity).toBe(1.0);
    });

    it('should merge ask levels correctly', () => {
      const existing = [
        { price: 50001, quantity: 1.0 },
        { price: 50002, quantity: 1.5 },
      ];
      const updates = [
        { price: 50002, quantity: 0 }, // Remove
        { price: 50003, quantity: 2.0 }, // Add new
      ];

      const result = (orderBookManager as any).mergeLevels(existing, updates, 'asks');
      
      expect(result).toHaveLength(2);
      expect(result.find(l => l.price === 50002)).toBeUndefined();
      expect(result.find(l => l.price === 50003)?.quantity).toBe(2.0);
    });
  });

  describe('calculateCumulative', () => {
    it('should calculate cumulative quantities correctly', () => {
      const levels = [
        { price: 50000, quantity: 1.5 },
        { price: 49999, quantity: 2.0 },
        { price: 49998, quantity: 1.0 },
      ];

      const result = (orderBookManager as any).calculateCumulative(levels);
      
      expect(result[0].cumulative).toBe(1.5);
      expect(result[1].cumulative).toBe(3.5);
      expect(result[2].cumulative).toBe(4.5);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate spread, mid-price, and VWAP correctly', () => {
      const state = {
        bids: [
          { price: 50000, quantity: 1.5, cumulative: 1.5 },
          { price: 49999, quantity: 2.0, cumulative: 3.5 },
        ],
        asks: [
          { price: 50001, quantity: 1.0, cumulative: 1.0 },
          { price: 50002, quantity: 1.5, cumulative: 2.5 },
        ],
      };

      (orderBookManager as any).state = state;
      const metrics = (orderBookManager as any).calculateMetrics();
      
      expect(metrics.spread).toBe(1); // 50001 - 50000
      expect(metrics.midPrice).toBe(50000.5); // (50000 + 50001) / 2
      expect(metrics.vwap).toBeGreaterThan(0);
    });
  });

  describe('getTopLevels', () => {
    it('should return top N levels', () => {
      const state = {
        bids: Array.from({ length: 50 }, (_, i) => ({
          price: 50000 - i,
          quantity: 1.0,
          cumulative: i + 1,
        })),
        asks: Array.from({ length: 50 }, (_, i) => ({
          price: 50001 + i,
          quantity: 1.0,
          cumulative: i + 1,
        })),
      };

      (orderBookManager as any).state = state;
      const topLevels = orderBookManager.getTopLevels(10);
      
      expect(topLevels.bids).toHaveLength(10);
      expect(topLevels.asks).toHaveLength(10);
      expect(topLevels.bids[0].price).toBe(50000);
      expect(topLevels.asks[0].price).toBe(50001);
    });
  });
});
