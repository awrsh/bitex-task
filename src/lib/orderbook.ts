import { OrderBookLevel, OrderBookSnapshot, OrderBookUpdate, OrderBookState } from '@/types/trading';

export class OrderBookManager {
  private state: OrderBookState;
  private onStateChange: (state: OrderBookState) => void;
  private lastUpdateId: number = 0;

  constructor(onStateChange: (state: OrderBookState) => void) {
    this.state = {
      bids: [],
      asks: [],
      spread: 0,
      midPrice: 0,
      vwap: 0,
      lastUpdateId: 0,
      isConnected: false,
      latency: 0,
    };
    this.onStateChange = onStateChange;
  }

  public async loadSnapshot(): Promise<void> {
    try {
      const response = await fetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=1000');
      const data: OrderBookSnapshot = await response.json();
      
      this.lastUpdateId = data.lastUpdateId;
      
      const bids = this.parseLevels(data.bids).sort((a, b) => b.price - a.price);
      const asks = this.parseLevels(data.asks).sort((a, b) => a.price - b.price);
      
      this.updateState({
        bids: this.calculateCumulative(bids),
        asks: this.calculateCumulative(asks),
        lastUpdateId: data.lastUpdateId,
      });
    } catch (error) {
      console.error('Failed to load order book snapshot:', error);
      throw error;
    }
  }

  public handleUpdate(update: OrderBookUpdate): void {
    // Validate sequence
    if (update.U !== this.lastUpdateId + 1) {
      console.warn('Sequence mismatch, reloading snapshot');
      this.loadSnapshot();
      return;
    }

    this.lastUpdateId = update.u;
    
    // Apply updates
    const bidUpdates = this.parseLevels(update.b);
    const askUpdates = this.parseLevels(update.a);
    
    this.state.bids = this.mergeLevels(this.state.bids, bidUpdates, 'bids');
    this.state.asks = this.mergeLevels(this.state.asks, askUpdates, 'asks');
    
    this.updateState({
      bids: this.calculateCumulative(this.state.bids),
      asks: this.calculateCumulative(this.state.asks),
      lastUpdateId: update.u,
    });
  }

  public setConnectionStatus(isConnected: boolean, latency: number = 0): void {
    this.updateState({
      isConnected,
      latency,
    });
  }

  private parseLevels(levels: [string, string][]): OrderBookLevel[] {
    return levels.map(([price, quantity]) => ({
      price: parseFloat(price),
      quantity: parseFloat(quantity),
    }));
  }

  private mergeLevels(
    existing: OrderBookLevel[],
    updates: OrderBookLevel[],
    side: 'bids' | 'asks'
  ): OrderBookLevel[] {
    const levelMap = new Map<number, number>();
    
    // Add existing levels
    existing.forEach(level => {
      if (level.quantity > 0) {
        levelMap.set(level.price, level.quantity);
      }
    });
    
    // Apply updates
    updates.forEach(level => {
      if (level.quantity === 0) {
        levelMap.delete(level.price);
      } else {
        levelMap.set(level.price, level.quantity);
      }
    });
    
    // Convert back to array and sort
    const merged = Array.from(levelMap.entries()).map(([price, quantity]) => ({
      price,
      quantity,
    }));
    
    return side === 'bids' 
      ? merged.sort((a, b) => b.price - a.price)
      : merged.sort((a, b) => a.price - b.price);
  }

  private calculateCumulative(levels: OrderBookLevel[]): OrderBookLevel[] {
    let cumulative = 0;
    return levels.map(level => {
      cumulative += level.quantity;
      return {
        ...level,
        cumulative,
      };
    });
  }

  private calculateMetrics(): { spread: number; midPrice: number; vwap: number } {
    const bestBid = this.state.bids[0];
    const bestAsk = this.state.asks[0];
    
    if (!bestBid || !bestAsk) {
      return { spread: 0, midPrice: 0, vwap: 0 };
    }
    
    const spread = bestAsk.price - bestBid.price;
    const midPrice = (bestBid.price + bestAsk.price) / 2;
    
    // Calculate VWAP for top 20 levels
    const topBids = this.state.bids.slice(0, 20);
    const topAsks = this.state.asks.slice(0, 20);
    
    let totalVolume = 0;
    let totalValue = 0;
    
    [...topBids, ...topAsks].forEach(level => {
      totalVolume += level.quantity;
      totalValue += level.price * level.quantity;
    });
    
    const vwap = totalVolume > 0 ? totalValue / totalVolume : 0;
    
    return { spread, midPrice, vwap };
  }

  private updateState(updates: Partial<OrderBookState>): void {
    this.state = { ...this.state, ...updates };
    
    // Recalculate metrics
    const metrics = this.calculateMetrics();
    this.state = { ...this.state, ...metrics };
    
    this.onStateChange(this.state);
  }

  public getState(): OrderBookState {
    return this.state;
  }

  public getTopLevels(count: number = 20): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
    return {
      bids: this.state.bids.slice(0, count),
      asks: this.state.asks.slice(0, count),
    };
  }
}
