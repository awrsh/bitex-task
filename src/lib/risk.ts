import { Balances, OrderTicket, RiskValidation, OrderBookLevel } from '@/types/trading';

export class RiskManager {
  private balances: Balances;
  private onBalanceChange: (balances: Balances) => void;

  constructor(
    initialBalances: Balances,
    onBalanceChange: (balances: Balances) => void
  ) {
    this.balances = { ...initialBalances };
    this.onBalanceChange = onBalanceChange;
  }

  public validateOrder(
    order: OrderTicket,
    orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }
  ): RiskValidation {
    // Basic validation
    if (order.quantity <= 0) {
      return {
        isValid: false,
        error: 'Quantity must be greater than 0',
        estimatedPrice: 0,
        estimatedCost: 0,
        pnlUp: 0,
        pnlDown: 0,
      };
    }

    const bestBid = orderBook.bids[0];
    const bestAsk = orderBook.asks[0];

    if (!bestBid || !bestAsk) {
      return {
        isValid: false,
        error: 'No market data available',
        estimatedPrice: 0,
        estimatedCost: 0,
        pnlUp: 0,
        pnlDown: 0,
      };
    }

    const estimatedPrice = order.side === 'buy' ? bestAsk.price : bestBid.price;
    const estimatedCost = order.quantity * estimatedPrice;

    // Balance validation
    if (order.side === 'buy') {
      if (estimatedCost > this.balances.usd) {
        return {
          isValid: false,
          error: `Insufficient USD balance. Required: $${estimatedCost.toFixed(2)}, Available: $${this.balances.usd.toFixed(2)}`,
          estimatedPrice,
          estimatedCost,
          pnlUp: 0,
          pnlDown: 0,
        };
      }
    } else {
      if (order.quantity > this.balances.btc) {
        return {
          isValid: false,
          error: `Insufficient BTC balance. Required: ${order.quantity.toFixed(8)}, Available: ${this.balances.btc.toFixed(8)}`,
          estimatedPrice,
          estimatedCost,
          pnlUp: 0,
          pnlDown: 0,
        };
      }
    }

    // Calculate PnL scenarios
    const pnlUp = this.calculatePnL(order, estimatedPrice * 1.005); // +0.5%
    const pnlDown = this.calculatePnL(order, estimatedPrice * 0.995); // -0.5%

    return {
      isValid: true,
      estimatedPrice,
      estimatedCost,
      pnlUp,
      pnlDown,
    };
  }

  public executeOrder(order: OrderTicket, estimatedPrice: number): boolean {
    // Minimal runtime checks using provided estimatedPrice
    if (order.quantity <= 0 || estimatedPrice <= 0) {
      return false;
    }

    const cost = order.quantity * estimatedPrice;

    if (order.side === 'buy') {
      if (cost > this.balances.usd) {
        return false;
      }
      this.balances.usd -= cost;
      this.balances.btc += order.quantity;
    } else {
      if (order.quantity > this.balances.btc) {
        return false;
      }
      this.balances.usd += cost;
      this.balances.btc -= order.quantity;
    }

    this.onBalanceChange(this.balances);
    return true;
  }

  private calculatePnL(order: OrderTicket, price: number): number {
    const currentValue = order.quantity * price;
    const cost = order.quantity * (order.side === 'buy' ? price : price);
    
    return order.side === 'buy' 
      ? currentValue - cost
      : cost - currentValue;
  }

  public getBalances(): Balances {
    return { ...this.balances };
  }

  public setBalances(balances: Balances): void {
    this.balances = { ...balances };
    this.onBalanceChange(this.balances);
  }

  public resetBalances(): void {
    this.balances = {
      usd: 10000,
      btc: 0.25,
    };
    this.onBalanceChange(this.balances);
  }

  public getPortfolioValue(currentPrice: number): number {
    return this.balances.usd + (this.balances.btc * currentPrice);
  }

  public getPortfolioChange(initialPrice: number, currentPrice: number): {
    change: number;
    changePercent: number;
  } {
    const initialValue = this.balances.usd + (this.balances.btc * initialPrice);
    const currentValue = this.getPortfolioValue(currentPrice);
    
    const change = currentValue - initialValue;
    const changePercent = initialValue > 0 ? (change / initialValue) * 100 : 0;
    
    return { change, changePercent };
  }
}

export const createRiskManager = (
  initialBalances: Balances,
  onBalanceChange: (balances: Balances) => void
): RiskManager => {
  return new RiskManager(initialBalances, onBalanceChange);
};
