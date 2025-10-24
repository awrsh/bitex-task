import { Trade, OHLC } from '@/types/trading';

export class CandleAggregator {
  private candles: OHLC[] = [];
  private currentCandle: OHLC | null = null;
  private onCandleUpdate: (candles: OHLC[]) => void;
  private maxCandles: number = 60; // 60 minutes

  constructor(onCandleUpdate: (candles: OHLC[]) => void) {
    this.onCandleUpdate = onCandleUpdate;
  }

  public addTrade(trade: Trade): void {
    const tradeTime = trade.timestamp;
    const minuteStart = this.getMinuteStart(tradeTime);
    
    // If we don't have a current candle or the trade is in a new minute
    if (!this.currentCandle || this.currentCandle.timestamp !== minuteStart) {
      // Finalize current candle if it exists
      if (this.currentCandle) {
        this.finalizeCandle();
      }
      
      // Start new candle
      this.currentCandle = {
        timestamp: minuteStart,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.quantity,
      };
    } else {
      // Update current candle
      this.updateCurrentCandle(trade);
    }
    
    this.notifyUpdate();
  }

  public addTrades(trades: Trade[]): void {
    trades.forEach(trade => this.addTrade(trade));
  }

  public getCandles(): OHLC[] {
    return [...this.candles];
  }

  public getCurrentCandle(): OHLC | null {
    return this.currentCandle;
  }

  public getCurrentPrice(): number {
    if (this.currentCandle) {
      return this.currentCandle.close;
    }
    if (this.candles.length > 0) {
      return this.candles[this.candles.length - 1].close;
    }
    return 0;
  }

  public getPriceChange(): { change: number; changePercent: number } {
    if (this.candles.length < 2) {
      return { change: 0, changePercent: 0 };
    }
    
    const firstCandle = this.candles[0];
    const lastCandle = this.candles[this.candles.length - 1];
    
    const change = lastCandle.close - firstCandle.open;
    const changePercent = (change / firstCandle.open) * 100;
    
    return { change, changePercent };
  }

  private getMinuteStart(timestamp: number): number {
    const date = new Date(timestamp);
    date.setSeconds(0, 0);
    return date.getTime();
  }

  private updateCurrentCandle(trade: Trade): void {
    if (!this.currentCandle) return;
    
    this.currentCandle.high = Math.max(this.currentCandle.high, trade.price);
    this.currentCandle.low = Math.min(this.currentCandle.low, trade.price);
    this.currentCandle.close = trade.price;
    this.currentCandle.volume += trade.quantity;
  }

  private finalizeCandle(): void {
    if (!this.currentCandle) return;
    
    this.candles.push({ ...this.currentCandle });
    this.currentCandle = null;
    
    // Keep only the last maxCandles candles
    if (this.candles.length > this.maxCandles) {
      this.candles = this.candles.slice(-this.maxCandles);
    }
  }

  private notifyUpdate(): void {
    const allCandles = this.currentCandle 
      ? [...this.candles, this.currentCandle]
      : [...this.candles];
    
    this.onCandleUpdate(allCandles);
  }

  public forceFinalizeCurrentCandle(): void {
    if (this.currentCandle) {
      this.finalizeCandle();
      this.notifyUpdate();
    }
  }

  public clear(): void {
    this.candles = [];
    this.currentCandle = null;
    this.notifyUpdate();
  }

  public setMaxCandles(max: number): void {
    this.maxCandles = max;
    
    // Trim existing candles if necessary
    if (this.candles.length > this.maxCandles) {
      this.candles = this.candles.slice(-this.maxCandles);
      this.notifyUpdate();
    }
  }
}

export const createCandleAggregator = (
  onCandleUpdate: (candles: OHLC[]) => void
): CandleAggregator => {
  return new CandleAggregator(onCandleUpdate);
};
