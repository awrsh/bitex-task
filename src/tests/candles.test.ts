import { CandleAggregator, createCandleAggregator } from '@/lib/candles';
import { Trade, OHLC } from '@/types/trading';

describe('CandleAggregator', () => {
  let candleAggregator: CandleAggregator;
  let mockOnCandleUpdate: jest.Mock;

  beforeEach(() => {
    mockOnCandleUpdate = jest.fn();
    candleAggregator = new CandleAggregator(mockOnCandleUpdate);
  });

  describe('addTrade', () => {
    it('should create new candle for first trade', () => {
      const trade: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000, // 2021-01-01 00:00:00
        isBuyerMaker: false,
      };

      candleAggregator.addTrade(trade);

      const currentCandle = candleAggregator.getCurrentCandle();
      expect(currentCandle).toBeTruthy();
      expect(currentCandle?.open).toBe(50000);
      expect(currentCandle?.high).toBe(50000);
      expect(currentCandle?.low).toBe(50000);
      expect(currentCandle?.close).toBe(50000);
      expect(currentCandle?.volume).toBe(1.0);
    });

    it('should update existing candle with new trade', () => {
      const trade1: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000,
        isBuyerMaker: false,
      };

      const trade2: Trade = {
        id: 2,
        price: 50100,
        quantity: 0.5,
        timestamp: 1609459205000, // Same minute
        isBuyerMaker: true,
      };

      candleAggregator.addTrade(trade1);
      candleAggregator.addTrade(trade2);

      const currentCandle = candleAggregator.getCurrentCandle();
      expect(currentCandle?.open).toBe(50000);
      expect(currentCandle?.high).toBe(50100);
      expect(currentCandle?.low).toBe(50000);
      expect(currentCandle?.close).toBe(50100);
      expect(currentCandle?.volume).toBe(1.5);
    });

    it('should create new candle for different minute', () => {
      const trade1: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000, // 00:00:00
        isBuyerMaker: false,
      };

      const trade2: Trade = {
        id: 2,
        price: 50100,
        quantity: 0.5,
        timestamp: 1609459260000, // 00:01:00 - different minute
        isBuyerMaker: true,
      };

      candleAggregator.addTrade(trade1);
      candleAggregator.addTrade(trade2);

      const candles = candleAggregator.getCandles();
      expect(candles).toHaveLength(1);
      expect(candles[0].close).toBe(50000);

      const currentCandle = candleAggregator.getCurrentCandle();
      expect(currentCandle?.open).toBe(50100);
      expect(currentCandle?.close).toBe(50100);
    });
  });

  describe('addTrades', () => {
    it('should add multiple trades at once', () => {
      const trades: Trade[] = [
        {
          id: 1,
          price: 50000,
          quantity: 1.0,
          timestamp: 1609459200000,
          isBuyerMaker: false,
        },
        {
          id: 2,
          price: 50100,
          quantity: 0.5,
          timestamp: 1609459205000,
          isBuyerMaker: true,
        },
        {
          id: 3,
          price: 49900,
          quantity: 0.8,
          timestamp: 1609459210000,
          isBuyerMaker: false,
        },
      ];

      candleAggregator.addTrades(trades);

      const currentCandle = candleAggregator.getCurrentCandle();
      expect(currentCandle?.open).toBe(50000);
      expect(currentCandle?.high).toBe(50100);
      expect(currentCandle?.low).toBe(49900);
      expect(currentCandle?.close).toBe(49900);
      expect(currentCandle?.volume).toBe(2.3);
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current candle close price', () => {
      const trade: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000,
        isBuyerMaker: false,
      };

      candleAggregator.addTrade(trade);
      expect(candleAggregator.getCurrentPrice()).toBe(50000);
    });

    it('should return last completed candle price', () => {
      const trade1: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000,
        isBuyerMaker: false,
      };

      const trade2: Trade = {
        id: 2,
        price: 50100,
        quantity: 0.5,
        timestamp: 1609459260000, // Different minute
        isBuyerMaker: true,
      };

      candleAggregator.addTrade(trade1);
      candleAggregator.addTrade(trade2);

      expect(candleAggregator.getCurrentPrice()).toBe(50100);
    });
  });

  describe('getPriceChange', () => {
    it('should calculate price change correctly', () => {
      const trades: Trade[] = [
        {
          id: 1,
          price: 50000,
          quantity: 1.0,
          timestamp: 1609459200000,
          isBuyerMaker: false,
        },
        {
          id: 2,
          price: 50100,
          quantity: 0.5,
          timestamp: 1609459260000, // Different minute
          isBuyerMaker: true,
        },
      ];

      candleAggregator.addTrades(trades);

      const priceChange = candleAggregator.getPriceChange();
      expect(priceChange.change).toBe(100);
      expect(priceChange.changePercent).toBe(0.2); // (100 / 50000) * 100
    });

    it('should return zero for insufficient data', () => {
      const priceChange = candleAggregator.getPriceChange();
      expect(priceChange.change).toBe(0);
      expect(priceChange.changePercent).toBe(0);
    });
  });

  describe('maxCandles', () => {
    it('should limit candles to maxCandles', () => {
      candleAggregator.setMaxCandles(3);

      // Add trades for 5 different minutes
      for (let i = 0; i < 5; i++) {
        const trade: Trade = {
          id: i + 1,
          price: 50000 + i * 100,
          quantity: 1.0,
          timestamp: 1609459200000 + i * 60000, // Each minute
          isBuyerMaker: false,
        };
        candleAggregator.addTrade(trade);
      }

      const candles = candleAggregator.getCandles();
      expect(candles).toHaveLength(3);
      expect(candles[0].open).toBe(50200); // Should keep last 3 candles
    });
  });

  describe('forceFinalizeCurrentCandle', () => {
    it('should finalize current candle', () => {
      const trade: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000,
        isBuyerMaker: false,
      };

      candleAggregator.addTrade(trade);
      expect(candleAggregator.getCurrentCandle()).toBeTruthy();

      candleAggregator.forceFinalizeCurrentCandle();
      expect(candleAggregator.getCurrentCandle()).toBeNull();
      expect(candleAggregator.getCandles()).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all candles and current candle', () => {
      const trade: Trade = {
        id: 1,
        price: 50000,
        quantity: 1.0,
        timestamp: 1609459200000,
        isBuyerMaker: false,
      };

      candleAggregator.addTrade(trade);
      candleAggregator.clear();

      expect(candleAggregator.getCandles()).toHaveLength(0);
      expect(candleAggregator.getCurrentCandle()).toBeNull();
    });
  });

  describe('createCandleAggregator', () => {
    it('should create aggregator with callback', () => {
      const aggregator = createCandleAggregator(mockOnCandleUpdate);
      expect(aggregator).toBeInstanceOf(CandleAggregator);
    });
  });
});
