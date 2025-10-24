# BitEx Trading Application

A professional-grade cryptocurrency trading micro-app built with Next.js, TypeScript, and Tailwind CSS. Features real-time order book data, live price charts, and simulated trading functionality.

## 🚀 Features

### Core Functionality
- **Live Price Chart**: Real-time candlestick chart showing last 60 minutes of BTC/USDT data
- **Level-2 Order Book**: Live order book with top 20 bids/asks, spread, mid-price, and VWAP
- **Order Ticket**: Simulated trading with balance validation and risk management
- **Real-time Data**: WebSocket connections to Binance for live market data

### Technical Features
- **WebSocket Management**: Auto-reconnect with exponential backoff
- **Order Book Management**: Snapshot loading and diff updates with sequence validation
- **Candle Aggregation**: Client-side OHLC candle generation from trade data
- **Risk Management**: Balance validation, PnL calculations, and order validation
- **Responsive Design**: Desktop-first layout with professional trading interface

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main trading page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── PriceChart.tsx     # TradingView chart component
│   ├── OrderBook.tsx      # Order book display
│   ├── OrderTicket.tsx    # Trading form
│   └── ConnectionStatus.tsx # Connection indicator
├── hooks/                 # Custom React hooks
│   ├── useOrderBook.ts    # Order book state management
│   ├── useTrades.ts       # Trade data and candles
│   └── useBalances.ts     # Balance and risk management
├── lib/                   # Core business logic
│   ├── websocket.ts       # WebSocket connection manager
│   ├── orderbook.ts       # Order book state management
│   ├── candles.ts         # OHLC candle aggregation
│   └── risk.ts            # Risk management and validation
├── types/                 # TypeScript definitions
│   └── trading.d.ts       # Trading data interfaces
└── tests/                 # Unit tests
    ├── orderbook.test.ts   # Order book tests
    ├── candles.test.ts    # Candle aggregation tests
    └── risk.test.ts       # Risk management tests
```

## 🔧 Architecture

### Data Flow
1. **WebSocket Connections**: Two separate connections for trades and order book
2. **State Management**: Custom hooks with Zustand-like patterns
3. **Real-time Updates**: Efficient re-rendering with React state
4. **Error Handling**: Graceful degradation and user feedback

### Key Components

#### WebSocket Manager (`src/lib/websocket.ts`)
- Auto-reconnect with exponential backoff
- Connection status monitoring
- Latency measurement
- Heartbeat management

#### Order Book Manager (`src/lib/orderbook.ts`)
- Snapshot loading from REST API
- Diff update application with sequence validation
- Level pruning and sorting
- Metrics calculation (spread, mid-price, VWAP)

#### Candle Aggregator (`src/lib/candles.ts`)
- Trade-to-OHLC conversion
- 1-minute candle generation
- Volume-weighted calculations
- Price change tracking

#### Risk Manager (`src/lib/risk.ts`)
- Balance validation
- Order risk assessment
- PnL scenario calculations
- Portfolio value tracking

## 🧪 Testing

The application includes comprehensive unit tests covering:

- **Order Book Logic**: Snapshot loading, diff updates, sequence validation
- **Candle Aggregation**: Trade-to-OHLC conversion, edge cases
- **Risk Management**: Balance validation, PnL calculations
- **WebSocket Handling**: Connection management, error scenarios

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🌐 API Integration

### Binance WebSocket Streams
- **Trades**: `wss://stream.binance.com:9443/ws/btcusdt@trade`
- **Order Book**: `wss://stream.binance.com:9443/ws/btcusdt@depth@100ms`

### Binance REST API
- **Order Book Snapshot**: `https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=1000`

### Exchange Choice Rationale
Binance was chosen for:
- **Liquidity**: Highest BTC/USDT trading volume
- **Stability**: Reliable WebSocket and REST APIs
- **Documentation**: Comprehensive API documentation
- **Rate Limits**: Generous rate limits for development

## 🎨 UI/UX Features

### Design System
- **Color Scheme**: Professional trading interface with green/red for buy/sell
- **Typography**: Inter font for readability
- **Layout**: Three-panel desktop layout (chart, order book, ticket)
- **Animations**: Smooth price update animations

### Accessibility
- **Keyboard Navigation**: Full keyboard support for form inputs
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: High contrast for readability
- **Focus Management**: Clear focus indicators

## ⚡ Performance Considerations

### Optimization Strategies
- **Virtualization**: Efficient rendering of large order book lists
- **Memoization**: Expensive calculations cached with useMemo
- **Throttling**: WebSocket updates throttled to prevent UI blocking
- **Lazy Loading**: Components loaded on demand

### Memory Management
- **Cleanup**: Proper WebSocket connection cleanup
- **Garbage Collection**: Efficient object lifecycle management
- **State Optimization**: Minimal re-renders with targeted updates

## 🔒 Security Considerations

### Client-Side Security
- **Input Validation**: All user inputs validated and sanitized
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: No sensitive operations performed
- **Data Sanitization**: All external data validated before use

### API Security
- **Rate Limiting**: Respectful API usage patterns
- **Error Handling**: Graceful degradation on API failures
- **Data Validation**: All incoming data validated against schemas

## 🚧 Known Limitations

### Current Limitations
- **Simulated Trading**: No real order execution (by design)
- **Single Symbol**: Only BTC/USDT supported
- **Client-Side Only**: No backend persistence
- **Limited Timeframes**: Only 1-minute candles

### Future Enhancements
- **Multiple Symbols**: Support for additional trading pairs
- **Advanced Charts**: Multiple timeframes and indicators
- **Order History**: Persistent order and trade history
- **Portfolio Analytics**: Advanced portfolio tracking

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Issues
```bash
# Check network connectivity
ping stream.binance.com

# Verify WebSocket URL
wss://stream.binance.com:9443/ws/btcusdt@trade
```

#### Chart Not Loading
- Ensure TradingView Lightweight Charts is properly installed
- Check browser console for JavaScript errors
- Verify WebSocket data is being received

#### Order Book Not Updating
- Check WebSocket connection status
- Verify sequence numbers are correct
- Monitor browser network tab for connection issues

### Debug Mode
Enable debug logging by setting `localStorage.debug = 'bitex:*'` in browser console.

## 📊 Performance Metrics

### Target Performance
- **Initial Load**: < 2 seconds
- **WebSocket Latency**: < 100ms
- **Chart Updates**: 60 FPS smooth animations
- **Order Book Updates**: < 50ms render time

### Monitoring
- Connection status indicators
- Latency measurements
- Error rate tracking
- Performance profiling

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run test suite
5. Submit pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Testing**: 80%+ coverage required

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Binance**: For providing reliable market data APIs
- **TradingView**: For the excellent Lightweight Charts library
- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework

---

**Built with ❤️ for the trading community**
