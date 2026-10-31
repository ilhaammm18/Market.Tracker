# Market.Tracker — Global Stock Intelligence

A premium fintech-inspired web application for tracking global equities, ETFs, and cryptocurrencies in real-time across multiple international exchanges.

Built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and live market data from **Yahoo Finance**.

---

## ✨ Features

### 🌐 Real-Time Multi-Exchange Tracking
Monitor stocks and assets across six global markets from a single dashboard:
- **BEI / IDX** — Indonesian blue-chips (BBCA, BMRI, BBRI, TLKM, ASII)
- **NASDAQ & NYSE** — US mega-caps and ETFs (AAPL, NVDA, MSFT, VOO, QQQ)
- **KRX** — Korean equities (Samsung 005930)
- **ASX** — Australian mining & resources (BHP, CBA)
- **Crypto** — Digital assets priced in USD (BTC, ETH, SOL)

All prices are sourced from Yahoo Finance's public Chart API with automatic symbol mapping (`.JK`, `.KS`, `.AX`, `-USD`) and proper currency formatting per exchange (IDR rounded to integers, USD/AUD to two decimals).

### 🔍 Dynamic Global Search
Press `Ctrl+K` to open the command-palette-style search bar. Type any ticker or company name to instantly filter local results or fetch live data for any symbol worldwide via the server-side API route.

### 📈 Interactive Timeframe Chart
The orbital price card features a smooth SVG area chart rendered from real Yahoo Finance historical quotes. Switch between five timeframes with a single click:

| Button | Yahoo Params | Use Case |
|--------|-------------|----------|
| **1D** | `interval=5m, range=1d` | Intraday price action |
| **1W** | `interval=15m, range=5d` | Short-term trend |
| **1M** | `interval=1d, range=1mo` | Monthly overview |
| **1Y** | `interval=1d, range=1y` | Annual performance |
| **ALL** | `interval=1wk, range=5y` | Long-term history |

### 📊 Bento Grid Fundamentals
Six glassmorphic metric cards displayed below the hero section:
- **Market Cap** — total capitalization with mega-cap / large-cap tier badge
- **P/E Ratio & EPS** — trailing twelve-month valuation
- **52-Week Range** — dynamic progress bar showing current price position
- **Daily Volume** — trading volume with 24h high/low
- **Dividend Yield** — annual cash distribution rate
- **Beta** — volatility profile relative to the broader market index

### ⭐ LocalStorage Watchlist
Star any stock to save it to your personal watchlist. The list is persisted in `localStorage`, survives page reloads, and is accessible from the slide-out drawer in the header.

### 🟢 Market State Detection
The app detects whether each exchange is currently open or closed by reading Yahoo Finance's `currentTradingPeriod` metadata. When a market is closed, prices are labeled as official closing prices with an amber status badge.

### 📡 Live Ticker Tape
A horizontally scrolling marquee at the top of the page displays synchronized real-time prices for 12 popular tickers across all supported markets — sourced from the same API feed as the main dashboard.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Data Source | [Yahoo Finance v8 Chart API](https://query1.finance.yahoo.com/) (public, no key required) |
| State | React `useState` / `useCallback` + `localStorage` |

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/ilhaammm18/Market.Tracker.git
cd Market.Tracker

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/stock/route.ts   # Server-side Yahoo Finance proxy
│   ├── globals.css           # Tailwind base + glassmorphism utilities
│   ├── layout.tsx            # Root layout with metadata & fonts
│   └── page.tsx              # Main client page (state + polling)
├── components/
│   ├── HeaderNav.tsx         # Top bar with search, watchlist, status
│   ├── GlobalTickerTape.tsx  # Scrolling marquee ticker strip
│   ├── HeroSection.tsx       # Split hero: identity + orbital card
│   ├── StockChart.tsx        # Interactive SVG area chart
│   ├── BentoFundamentals.tsx # Six-card fundamental metrics grid
│   ├── MarketExplorer.tsx    # Multi-market filter & stock cards
│   ├── WatchlistDrawer.tsx   # Slide-out watchlist panel
│   ├── ApiSettingsModal.tsx  # Data source info modal
│   └── Footer.tsx            # Disclaimer & timestamp footer
├── data/
│   └── mockStocks.ts         # Baseline profiles & initial tape data
├── lib/
│   └── utils.ts              # Currency formatting & helpers
└── types/
    └── stock.ts              # TypeScript interfaces
```

---

## ⚠️ Disclaimer

> This application is for **educational and portfolio demonstration purposes only**.
> It is **not** financial advice and should **not** be used as the sole basis for any investment decision.
> All market data is provided by Yahoo Finance and may be delayed.

---

## 📄 License

MIT © 2026 Muhammad Nur Ilham
