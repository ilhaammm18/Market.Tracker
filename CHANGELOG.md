# Changelog

All notable changes to **Market.Tracker** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-12-08

### Added
- **Portfolio Risk Allocation & Rebalancing Analytics (`src/types/stock.ts`, `src/lib/portfolio.ts`, `src/components/PortfolioAllocationPanel.tsx`)**:
  - Added 3 target risk profiles (**Moderate**, **Volatile**, **Aggressive**) with preset target weight benchmarks across `IDX`, `US / Global`, and `CRYPTO`.
  - Built `calculatePortfolioRebalancing()` to compute actual asset weights, target deviations, alignment Health Score (`0–100%`), `Overweight` / `Underweight` / `On Target` status, and exact nominal IDR buy/trim rebalancing suggestions.
  - Created interactive `PortfolioAllocationPanel` integrated directly inside `PortfolioDrawer`.
- **JSON Portfolio Import & Restore (`src/lib/portfolio.ts`, `src/components/PortfolioDrawer.tsx`)**:
  - Added strict JSON schema validation and parsing via `parsePortfolioImportJSON()` and merge/replace reconciliation via `applyPortfolioImport()`.
  - Added **Import JSON** upload controls in `PortfolioDrawer` supporting both **Merge** (weighted-average combination) and **Replace** (full overwrite) modes with instant success/error validation feedback.
- **Smart Price Alerts (`src/lib/alerts.ts`, `src/components/WatchlistDrawer.tsx`, `src/components/HeaderNav.tsx`)**:
  - Built `localStorage`-backed target price alert management (`target_buy ≤` and `target_sell ≥`) with live market price evaluation (`evaluatePriceAlerts`) and distance-to-target tracking.
  - Upgraded `WatchlistDrawer` with a mobile-first tabbed interface for managing Watchlist stocks and Smart Price Alerts (create, inspect live status, delete, and one-click bell shortcut per watched ticker).
  - Connected live alert evaluation in `src/app/page.tsx` and `src/app/market/page.tsx` to display a pulsing notification badge in `HeaderNav` whenever one or more assets hit their target price.

---

## [1.4.0] - 2026-12-05

### Added
- **Home Portfolio Summary Widget (`src/components/PortfolioSummaryCard.tsx`, `src/app/page.tsx`)**:
  - Created a compact glassmorphic `PortfolioSummaryCard` banner on the Landing Page displaying real-time Total Portfolio Equity (IDR), Total Floating PnL (`Rp` and `%`), active asset count, segmented allocation bar, and interactive asset chips with a direct **"Kelola Portofolio"** drawer trigger.
- **Asset Class Filter Tabs & Subtotal Analytics (`src/lib/portfolio.ts`, `src/components/PortfolioDrawer.tsx`)**:
  - Added category filtering (`ALL`, `IDX`, `US / Global`, `CRYPTO`) inside `PortfolioDrawer` with automatic per-category equity and PnL subtotal calculation.
- **Portfolio JSON & CSV Export Utilities (`src/lib/portfolio.ts`, `src/components/PortfolioDrawer.tsx`)**:
  - Implemented one-click **Export JSON** and **Export CSV** download actions in the drawer footer with instant download confirmation feedback.

### Changed
- **Mobile-First Responsive UI/UX Optimization (`HeaderNav.tsx`, `PortfolioDrawer.tsx`, `MarketExplorer.tsx`, `StockChart.tsx`)**:
  - Refined touch targets (`min-h-[38px]` / `min-h-[42px]`), compact spacing, and adaptive full-width drawer layout on viewports `< 640px`.
  - Prevented horizontal card/table overflow in `MarketExplorer` and added dynamic viewport-aware chart height scaling (`175px` mobile / `200px` desktop) in `StockChart`.

---

## [1.3.0] - 2026-12-01

### Added
- **Multi-Asset Portfolio & Multi-Currency PnL Tracker (`src/lib/portfolio.ts`, `src/types/stock.ts`)**:
  - Defined `PortfolioItem`, `PortfolioAllocationItem`, and `PortfolioSummary` interfaces for strict multi-currency portfolio tracking.
  - Built automatic foreign exchange conversion engine (`FX_RATES_TO_IDR`) converting `USD`, `AUD`, and `KRW` positions into Indonesian Rupiah (`IDR`) equivalents.
  - Implemented real-time floating Profit & Loss (`PnL`) calculation (nominal IDR, original currency, and percentage return) per asset and across the combined portfolio, along with asset allocation weight percentages.
  - Added `localStorage` persistence (`loadPortfolio` and `savePortfolio`) pre-seeded with 3 popular global assets (`BBCA.JK`, `NVDA`, `BTC-USD`).
- **Interactive Portfolio Slide-Over Drawer (`src/components/PortfolioDrawer.tsx`)**:
  - Created a glassmorphic Dark-Mode Navy & Gold slide-over drawer displaying Total Portfolio Equity (IDR), Combined Cost Basis, Total Floating PnL, and a segmented multi-color asset allocation progress bar.
  - Added position management form supporting new asset entry, automatic weighted-average buy price calculation on existing tickers, position editing, removal, and one-click demo seed reset.
- **Global Header & Route Integration (`src/components/HeaderNav.tsx`, `src/app/page.tsx`, `src/app/market/page.tsx`)**:
  - Added a dedicated **Portfolio** trigger button with active asset count badge in `HeaderNav`, synchronized with live market prices across both the Landing Page (`/`) and Market Terminal (`/market`).

---

## [1.2.0] - 2026-11-18

### Added
- **Dual-View Route Architecture (`/` & `/market`)**:
  - Separated the application into a dedicated **Modern Fintech Landing Page** (`src/app/page.tsx` + `src/components/LandingSection.tsx`) and a full-featured **Market Terminal** (`src/app/market/page.tsx`).
  - Added deep-link query support (`/market?ticker=SYMBOL`) wrapped in a React `<Suspense>` boundary for direct ticker navigation from the Landing Page, Global Ticker Tape, or Search Modal.
  - Added **Hero Quick Search** with 300ms debounced Yahoo Finance autocomplete, quick-access ticker chips (`BBCA`, `BMRI`, `BBRI`, `NVDA`, `AAPL`, `VOO`, `BTC-USD`), and a primary **"Launch Market Terminal"** CTA.
  - Added **Live Market Snapshot** section featuring 4 interactive mini-cards (`BBCA.JK`, `NVDA`, `BTC-USD`, `AAPL`) with real-time prices, daily percentage badges, SVG sparklines, and live `RSI (14)` readings.
  - Added **Platform Capabilities** Bento Grid showcasing the 4 core pillars of the platform.
- **Technical Indicators & Volume Engine (`src/lib/indicators.ts`)**:
  - Implemented pure, strictly-typed calculation functions:
    - `calculateSMA(data, period)` for Simple Moving Average (**SMA 20**).
    - `calculateEMA(data, period)` for Exponential Moving Average (**EMA 50**).
    - `calculateRSI(data, period)` using Wilder's smoothing for Relative Strength Index (**RSI 14**) with automatic signal classification (`"Overbought"`, `"Oversold"`, `"Neutral"`).
    - `summarizeTechnicalMomentum(data, sma20, ema50)` for moving average trend bias (`Bullish`, `Bearish`, `Sideways`) and relative volume ratio analysis.
- **Interactive Indicator Overlays & Volume Histogram (`src/components/StockChart.tsx`)**:
  - Added interactive **"SMA 20"** (amber line) and **"EMA 50"** (cyan line) overlay toggles directly on top of the `lightweight-charts` Area and Candlestick series.
  - Added a live **RSI (14) Signal Badge** in the chart header with semantic status coloring (Red for Overbought `> 70`, Emerald for Oversold `< 30`, Cyan for Neutral `30–70`).
  - Added an on-canvas volume histogram (`HistogramSeries`) and a bottom **Volume Distribution & Technical Momentum Summary** bar.

### Changed
- **Header Route Navigation (`src/components/HeaderNav.tsx`)**:
  - Added an explicit route switcher to navigate between **Home (`/`)** and **Market Terminal (`/market`)** across desktop and mobile viewports.
- **Historical Data Depth (`src/data/mockStocks.ts`)**:
  - Expanded deterministic OHLC history series across all 5 timeframes (`1D`, `1W`, `1M`, `1Y`, `ALL`) to 60–80 data points per timeframe for accurate multi-period SMA 20, EMA 50, and RSI 14 calculations.

---

## [1.1.0] - 2026-11-14

### Added
- **Live Yahoo Finance Search & News API (`src/app/api/search/route.ts`)**:
  - Integrated Yahoo Finance v1 Search endpoint with parallel `.JK` query prioritization for 4-letter Indonesian (BEI/IDX) stock codes.
  - Extracted real-time ticker news articles for the active stock.
- **Professional Financial Charting (`src/components/StockChart.tsx`)**:
  - Integrated `lightweight-charts` v5 supporting **Area** (Gold gradient) and **Candlestick** (OHLC Emerald/Rose) modes.
  - Added interactive crosshair readout displaying date, time, Open, High, Low, and Close prices.
  - Added dynamic **Min**, **Max**, and **Volatility** spread calculations per active timeframe (`1D`, `1W`, `1M`, `1Y`, `ALL`).
- **Head-to-Head Stock Comparison & Smart IDX Lot Simulator (`src/components/CompareAndSimulator.tsx`)**:
  - Built a dual-series normalized percentage return comparison chart to benchmark two stocks side-by-side (e.g., `BBCA` vs `BMRI` or `VOO` vs `QQQ`).
  - Built an interactive **Investment & Smart Lot Calculator** that automatically applies `1 Lot = 100 Shares` for IDX (`.JK`) equities and per-unit calculation for global stocks/crypto, complete with target profit simulation.
- **Live Market News Section (`src/components/MarketNewsSection.tsx`)**:
  - Added a dedicated news feed section displaying latest media releases, publishers, timestamps, related ticker pills, and direct article links.
- **Interactive Section Navigation (`01 / 04` — `04 / 04`)**:
  - Upgraded the header indicator into an interactive scroll-spy navigation menu covering `01 OVERVIEW`, `02 FUNDAMENTALS`, `03 COMPARE & SIMULATOR`, and `04 MARKET NEWS`.

### Changed
- **Real-Time Yahoo Finance v8 Chart Engine (`src/app/api/stock/route.ts`)**:
  - Removed random/stochastic price simulation and connected directly to Yahoo Finance v8 Chart API.
  - Enforced currency-specific rounding rules (`Math.round` integer formatting for `IDR` and `KRW`; 2 decimal places for `USD` and `AUD`).
  - Synchronized state between `GlobalTickerTape` (starting with `BBCA (IDX)`) and the main orbital card.
- **Dynamic Intelligence Brief & Bento Fundamentals (`src/lib/utils.ts`, `src/components/BentoFundamentals.tsx`)**:
  - Added `generateDynamicInsight()` to synthesize automated market commentary based on 52-week range position, daily momentum, and trading volume.
  - Updated the 6 Bento Fundamental cards with real 24H range spread, 52-week support/resistance progress bar, IDX Lot volume conversion, Open vs Previous Close comparison, Market Cap valuation, and Beta profile.

---

## [1.0.0] - 2026-11-01

### Added
- Initial release of **Market.Tracker — Global Stock Intelligence**.
- Designed Dark-Mode Navy (`#040914`, `#0A192F`) & Gold (`#F5B700`) Glassmorphism UI with Framer Motion animations.
- Built core components: `HeaderNav`, `GlobalTickerTape`, `HeroSection` with rotating orbital rings, `BentoFundamentals`, `MarketExplorer` with multi-region filtering (`ALL`, `IDX`, `US`, `KRX`, `ASX`, `ETF`, `CRYPTO`), `WatchlistDrawer` with `localStorage` persistence, `ApiSettingsModal`, and `Footer`.
- Created resilient baseline dataset in `src/data/mockStocks.ts` covering 12 global benchmark assets (`BMRI`, `BBCA`, `BBRI`, `TLKM`, `ASII`, `AAPL`, `NVDA`, `MSFT`, `VOO`, `005930`, `BHP`, `BTC`).
