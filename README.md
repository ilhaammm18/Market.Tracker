<div align="center">

# 🌐 Market.Tracker
### Institutional-Grade Global Market Intelligence & Stock Tracking Web Application

*Real-time multi-exchange equity & crypto tracking, interactive OHLC technical charting (SMA 20 · EMA 50 · RSI 14), head-to-head return benchmarking, smart IDX lot simulation, and live financial news in a modern Dark-Mode Glassmorphism interface.*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.11-F5B700?style=for-the-badge&logo=framer&logoColor=black)](https://www.framer.com/motion/)
[![Lightweight Charts](https://img.shields.io/badge/Lightweight_Charts-5.3-10B981?style=for-the-badge&logo=tradingview&logoColor=white)](https://www.tradingview.com/lightweight-charts/)
[![Yahoo Finance API](https://img.shields.io/badge/Yahoo_Finance-v8_Live_API-720E9E?style=for-the-badge)](https://finance.yahoo.com/)
[![Version](https://img.shields.io/badge/Version-1.4.0-F5B700?style=for-the-badge)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](#contributing--author)

---

[**Explore Features**](#-key-features) · [**Tech Stack**](#-technology-stack) · [**Project Structure**](#-project-structure) · [**Getting Started**](#-installation--setup) · [**Architecture**](#-data-sources--architecture) · [**Changelog**](./CHANGELOG.md)

</div>

---

## 📑 Table of Contents

1. [About The Project](#-about-the-project)
2. [Key Features](#-key-features)
3. [Application Preview](#-application-preview)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [Installation & Setup](#-installation--setup)
7. [How to Use](#-how-to-use)
8. [Data Sources & Architecture](#-data-sources--architecture)
9. [Future Roadmap](#-future-roadmap)
10. [Contributing & Author](#-contributing--author)

---

## 🏛 About The Project

**Market.Tracker** adalah aplikasi web *Global Market Intelligence* bergaya *Fintech Modern* (**Dark-Mode Navy `#040914` & Gold `#F5B700` dengan Glassmorphism**) yang dirancang untuk membantu investor ritel maupun analis memantau pergerakan harga saham dan aset global secara *real-time* tanpa memerlukan API key berbayar.

### Masalah yang Diselesaikan
Banyak *tracker* saham modern mengalami kendala berikut:
- Terbatas pada satu bursa saja atau mencampuradukkan format desimal mata uang (misalnya menampilkan desimal sen pada Rupiah `IDR` atau Won `KRW`).
- Tidak mengenali aturan satuan **1 Lot = 100 Lembar** yang berlaku di Bursa Efek Indonesia (**BEI / IDX**).
- Menampilkan grafik statis tanpa indikator teknikal esensial (**SMA**, **EMA**, **RSI**) maupun perbandingan performa *head-to-head* antar emiten.

### Solusi Arsitektur Dual-View
Pada versi **v1.2.0**, **Market.Tracker** mengadopsi arsitektur **Dual-View Route**:
1. **Interactive Fintech Landing Page (`/`)**: Halaman muka eksekutif dengan *Global Ticker Tape*, *Hero Quick Search* berfitur *autocomplete*, **Live Market Snapshot** (4 kartu mini interaktif dengan *sparkline* & pembacaan `RSI 14`), serta *Platform Capabilities Bento Showcase*.
2. **Full Market Terminal (`/market`)**: Ruang kerja analitik mendalam yang mencakup *Hero Orbital Chart*, *Bento Grid Fundamental*, *Head-to-Head Return & Smart IDX Lot Simulator*, *Live Market News*, serta *Multi-Market Explorer* yang terbagi ke dalam navigasi interaktif `01 / 04` hingga `04 / 04`.

---

## ✨ Key Features

### 1. 🖥️ Dual-View Experience (`LandingSection.tsx` & `/market`)
- **Landing Page (`/`)**: Menyajikan ikhtisar pasar secara instan melalui komponen `LandingSection.tsx`. Pengguna dapat mencari saham dari seluruh dunia atau mengeklik kartu *Live Market Snapshot* (`BBCA.JK`, `NVDA`, `BTC-USD`, `AAPL`) untuk langsung melompat ke terminal analisis melalui *deep-link* `/market?ticker=SYMBOL`.
- **Market Terminal (`/market`)**: Dashboard penuh dengan *scroll-spy* otomatis (`01 OVERVIEW`, `02 FUNDAMENTALS`, `03 COMPARE & SIMULATOR`, `04 MARKET NEWS`) dan *header* navigasi yang memudahkan perpindahan antar halaman.

### 2. 🌍 Real-Time Multi-Exchange & Multi-Currency Tracking
Memantau saham, ETF, dan aset kripto lintas 6 bursa utama dunia:
- **BEI / IDX (Indonesia)** — Saham *blue-chip* & *second-liner* (`BBCA`, `BMRI`, `BBRI`, `TLKM`, `ASII`, `BREN`, `ANTM`, `GOTO`, dll.) dengan akhiran `.JK`.
- **NASDAQ & NYSE (Amerika Serikat)** — Saham teknologi & ETF global (`AAPL`, `NVDA`, `MSFT`, `VOO`, `QQQ`).
- **KRX (Korea Selatan)** — Ekuitas unggulan Korea (`005930.KS` Samsung Electronics).
- **ASX (Australia)** — Emiten komoditas & pertambangan (`BHP.AX`).
- **CRYPTO (Global 24/7)** — Aset digital dalam denominasi USD (`BTC-USD`, `ETH-USD`, `SOL-USD`).
- **Presisi Mata Uang (`src/lib/utils.ts`)**: Otomatis membulatkan harga `IDR` dan `KRW` ke bilangan bulat (`Math.round`) serta mempertahankan 2 angka desimal untuk `USD` dan `AUD`.

### 3. 📈 Interactive Technical Charting (`StockChart.tsx` & `indicators.ts`)
Menggunakan `lightweight-charts` v5 di dalam kartu orbit interaktif dengan fitur:
- **Dual Chart Mode**: Toggle instan antara grafik **Area** (garis emas `#F5B700` bergradasi) dan **Candlestick OHLC** (hijau `#10B981` / merah `#F43F5E`) lengkap dengan *crosshair readout* waktu dan harga `O / H / L / C`.
- **Moving Average Overlays**: Tombol toggle interaktif untuk menampilkan/menyembunyikan garis **SMA 20** (*Simple Moving Average* — kuning/amber) dan **EMA 50** (*Exponential Moving Average* — biru/cyan) langsung di atas grafik harga.
- **Live RSI (14) Signal Badge**: Perhitungan *Relative Strength Index* 14-periode menggunakan metode *Wilder's Smoothing* yang menampilkan nilai RSI terkini beserta badge status warna:
  - 🔴 **Overbought (`> 70`)** — Area jenuh beli (Merah).
  - 🟢 **Oversold (`< 30`)** — Area jenuh jual (Hijau).
  - 🔵 **Neutral (`30 – 70`)** — Zona momentum seimbang (Biru/Cyan).
- **Volume Histogram & Momentum Summary**: Menampilkan histogram volume transaksi di bagian bawah kanvas grafik serta ringkasan rasio volume rata-rata, sinyal tren MA (`▲ BULLISH`, `▼ BEARISH`, `◆ SIDEWAYS`), nilai `Min`, `Maks`, dan `Volatilitas` untuk 5 *timeframe* (`1D`, `1W`, `1M`, `1Y`, `ALL`).

### 4. 🧱 Bento Grid Fundamentals (`BentoFundamentals.tsx`)
Enam kartu metrik fundamental & statistik pasar yang dihidrasi secara dinamis dari data *real-time*:
1. **Rentang Harga Harian (24H Range)**: *Progress bar* posisi harga saat ini terhadap *Low* dan *High* harian beserta persentase *spread*.
2. **Rentang 52-Minggu (52W High/Low)**: Indikator visual posisi harga terhadap *Support* dan *Resistance* tahunan.
3. **Volume Transaksi Harian & Likuiditas**: Konversi otomatis ke satuan **Lot BEI** (`Volume / 100`) untuk saham Indonesia dan estimasi nilai *turnover* transaksi.
4. **Harga Pembukaan & Penutupan Sebelumnya**: Perbandingan harga *Open* sesi berjalan terhadap *Previous Close*.
5. **Estimasi Kapitalisasi & Valuasi**: Klasifikasi *Mega-Cap / Large-Cap*, rasio `P/E`, dan *Dividend Yield*.
6. **Profil Volatilitas & Beta Pasar**: Indikator sensitivitas risiko (`Defensif`, `Moderat`, `High Beta`) beserta ayunan rentang tahunan.

### 5. ⚖️ Head-to-Head Stock Comparison & IDX Lot Calculator (`CompareAndSimulator.tsx`)
- **Head-to-Head Return Comparison**: Membandingkan performa persentase *return* (`%`) dua saham secara berdampingan pada satu kanvas grafik yang ternormalisasi (contoh: `BMRI` vs `BBCA` atau `NVDA` vs `AAPL`), lengkap dengan pencarian emiten pembanding bebas dan indikator selisih *outperformance/underperformance*.
- **Smart Investment & IDX Lot Calculator**:
  - Jika saham aktif berasal dari **BEI / IDX (`.JK`)**, kalkulator otomatis menggunakan satuan **Lot (`1 Lot = 100 Lembar`)**.
  - Jika saham berasal dari bursa AS/Global/Kripto, kalkulator menggunakan satuan **Unit / Lembar**.
  - Dilengkapi slider simulasi **Target Profit (`+1%` s/d `+100%`)** untuk menghitung proyeksi nilai akhir portofolio dan estimasi keuntungan bersih.

### 6. 📡 Live Global Ticker Tape, Watchlist Drawer & Market News Feed
- **Global Ticker Tape (`GlobalTickerTape.tsx`)**: Baris *marquee* bergerak di bagian atas layar yang tersinkronisasi 100% dengan state harga kartu utama (dimulai dengan ticker `BBCA (IDX)`).
- **Persistent Watchlist (`WatchlistDrawer.tsx`)**: Simpan saham favorit ke dalam *slide-out drawer* yang tersimpan permanen di `localStorage`.
- **Live Financial News (`MarketNewsSection.tsx`)**: Menampilkan kartu berita terkini terkait emiten yang sedang dianalisis lengkap dengan judul, nama penerbit, waktu rilis relatif, tag ticker terkait, dan tautan langsung ke artikel sumber.

### 7. 💼 Multi-Asset Portfolio & Multi-Currency PnL Tracker (`PortfolioDrawer.tsx`, `PortfolioSummaryCard.tsx` & `portfolio.ts`)
- **Home Portfolio Overview Widget (`PortfolioSummaryCard.tsx`)**: Menampilkan ringkasan cepat Total Ekuitas (IDR), Floating PnL, bar alokasi, dan chip aset langsung di halaman utama.
- **Auto-IDR FX Valuation & Category Filter**: Menghitung nilai ekuitas lintas mata uang (`IDR`, `USD`, `AUD`, `KRW`) ke ekuivalen `IDR`, dilengkapi tab filter kategori aset (`ALL`, `IDX`, `US / Global`, `CRYPTO`) beserta subtotal per kategori.
- **Real-Time Floating PnL & Allocation Bar**: Menampilkan keuntungan/kerugian mengambang (*Unrealized PnL* dalam `Rp` dan `%`) baik secara agregat maupun per aset, dilengkapi *segmented progress bar* bobot alokasi portofolio.
- **Position Management, JSON/CSV Export & LocalStorage**: Mendukung tambah/average/edit/hapus posisi, penyimpanan permanen di `localStorage` dengan 3 aset *seed default* (`BBCA.JK`, `NVDA`, `BTC-USD`), serta ekspor laporan portofolio ke format **JSON** dan **CSV**.

---

## 🖼️ Application Preview

> Anda dapat menempatkan tangkapan layar (*screenshots*) aplikasi pada direktori `public/screenshots/` dengan struktur berikut:

| Landing Page (`/`) — Modern Fintech Home | Market Terminal (`/market`) — Orbital Technical Chart |
| :---: | :---: |
| ![Landing Page Preview](https://placehold.co/800x450/040914/F5B700?text=Market.Tracker+Landing+Page+%28%2F%29) | ![Market Terminal Preview](https://placehold.co/800x450/0A192F/06B6D4?text=Market+Terminal+%28%2Fmarket%29+SMA20+EMA50+RSI14) |
| *Hero Quick Search, Live Market Snapshot (4 Mini Cards) & Platform Capabilities* | *Hero Section, Intelligence Brief, Candlestick/Area Chart + SMA 20, EMA 50 & RSI 14* |

| Head-to-Head Return & Smart IDX Lot Simulator | Bento Fundamentals & Live Market News |
| :---: | :---: |
| ![Compare & Simulator Preview](https://placehold.co/800x450/0A192F/10B981?text=Head-to-Head+Compare+%26+IDX+Lot+Simulator) | ![Bento & News Preview](https://placehold.co/800x450/040914/F5B700?text=Bento+Fundamentals+%26+Live+Market+News) |
| *Normalized Dual-Stock Return Chart & Automatic 1 Lot = 100 Shares Calculator* | *6 Real-Time Fundamental Cards & Curated Yahoo Finance News Feed* |

---

## 🛠 Technology Stack

Seluruh teknologi dan *library* berikut terkonfigurasi secara nyata di dalam [`package.json`](./package.json):

| Kategori | Teknologi / Library | Versi | Kegunaan Utama |
| :--- | :--- | :--- | :--- |
| **Core Framework** | [Next.js (App Router)](https://nextjs.org/) | `^14.2.16` | Server/Client rendering, routing (`/` & `/market`), dan Server API Routes |
| **UI Library** | [React](https://react.dev/) & `react-dom` | `^18.3.1` | Arsitektur komponen deklaratif dan manajemen *state* reaktif |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5.6.3` | Keamanan tipe statis (*strict typing*) untuk model data & kalkulasi indikator |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^3.4.14` | Desain *Dark-Mode Navy & Gold*, *glassmorphism*, dan *responsive grid* |
| **Financial Charting** | [Lightweight Charts](https://www.tradingview.com/lightweight-charts/) | `^5.3.0` | Rendering kanvas HTML5 untuk Area, Candlestick OHLC, Line (SMA/EMA), & Histogram Volume |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) | `^11.11.10` | Animasi transisi ticker, *orbital rings*, dan interaksi *hover* kartu |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^0.453.0` | Ikon vektor modern untuk indikator finansial dan navigasi |
| **Class Utilities** | `clsx` & `tailwind-merge` | `^2.1.1` / `^2.5.4` | Penggabungan *class* Tailwind CSS secara dinamis dan bebas konflik |

---

## 📁 Project Structure

Struktur direktori proyek saat ini:

```text
Market.Tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── search/
│   │   │   │   └── route.ts          # Proxy API pencarian global & berita Yahoo Finance v1 (prioritas .JK)
│   │   │   └── stock/
│   │   │       └── route.ts          # Proxy API Yahoo Finance v8 Chart (OHLC, metadata, & live ticker tape)
│   │   ├── market/
│   │   │   └── page.tsx              # Route Market Terminal (/market) dengan dukungan ?ticker=SYMBOL
│   │   ├── globals.css               # Konfigurasi dasar Tailwind, custom scrollbar, & animasi marquee/glow
│   │   ├── layout.tsx                # Root layout, konfigurasi font (Inter & JetBrains Mono), & SEO metadata
│   │   └── page.tsx                  # Route Home / Landing Page (/) bergaya Fintech Modern
│   ├── components/
│   │   ├── ApiSettingsModal.tsx      # Modal informasi status koneksi Yahoo Finance v8 & refresh manual
│   │   ├── BentoFundamentals.tsx     # Seksi 02/04: 6 kartu Bento metrik fundamental & statistik perdagangan
│   │   ├── CompareAndSimulator.tsx   # Seksi 03/04: Grafik komparasi return 2 saham & Kalkulator Lot Pintar
│   │   ├── Footer.tsx                # Footer aplikasi dengan informasi bursa & disclaimer investasi
│   │   ├── GlobalTickerTape.tsx      # Baris marquee harga saham real-time di bagian atas halaman
│   │   ├── HeaderNav.tsx             # Navigasi utama (Home vs Terminal, Search Cmd+K, 01-04 Nav, Watchlist)
│   │   ├── HeroSection.tsx           # Seksi 01/04: Identitas emiten, Intelligence Brief, & Kartu Orbit
│   │   ├── LandingSection.tsx        # Komponen utama Landing Page (Hero, Live Snapshot, Platform Capabilities)
│   │   ├── MarketExplorer.tsx        # Eksplorasi saham dengan filter regional (ALL, IDX, US, KRX, ASX, CRYPTO)
│   │   ├── MarketNewsSection.tsx     # Seksi 04/04: Daftar kartu berita pasar terkini untuk saham aktif
│   │   ├── PortfolioDrawer.tsx       # Slide-over drawer manajemen portofolio, filter kategori, & ekspor JSON/CSV
│   │   ├── PortfolioSummaryCard.tsx  # Widget ringkasan ekuitas portofolio & PnL cepat di halaman beranda
│   │   ├── StockChart.tsx            # Komponen grafik lightweight-charts (Area, Candle, SMA 20, EMA 50, RSI 14)
│   │   └── WatchlistDrawer.tsx       # Panel slide-out daftar pantauan saham berbasis LocalStorage
│   ├── data/
│   │   └── mockStocks.ts             # Data baseline deterministik 12 saham global & konfigurasi awal Ticker Tape
│   ├── lib/
│   │   ├── indicators.ts             # Pure functions kalkulasi teknikal: calculateSMA, calculateEMA, calculateRSI
│   │   ├── portfolio.ts              # Engine kalkulasi portofolio lintas mata uang, konversi FX IDR, & LocalStorage
│   │   └── utils.ts                  # Formatter mata uang, pembulatan IDR/KRW, & generator Dynamic Insight
│   └── types/
│       └── stock.ts                  # Definisi interface TypeScript (StockData, StockPricePoint, PortfolioItem, dll.)
├── CHANGELOG.md                      # Catatan riwayat rilis versi v1.0.0 hingga v1.4.0
├── next.config.mjs                   # Konfigurasi Next.js (transpilePackages: lightweight-charts & fancy-canvas)
├── package.json                      # Metadata proyek, scripts, dan daftar dependencies
├── postcss.config.js                 # Konfigurasi PostCSS & Autoprefixer
├── tailwind.config.js                # Konfigurasi tema warna Navy/Gold, font, dan shadow kustom
└── tsconfig.json                     # Konfigurasi kompilator TypeScript & path alias (@/*)
```

---

## 🚀 Installation & Setup

### Prasyarat
- **Node.js** versi `18.17.0` atau lebih baru (direkomendasikan Node.js 20 LTS).
- **npm** (bawaan Node.js).
- Tidak memerlukan konfigurasi `.env` atau API key berbayar.

### Langkah Instalasi

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/ilhaammm18/Market.Tracker.git
   cd Market.Tracker
   ```

2. **Instal seluruh *dependencies*:**
   ```bash
   npm install
   ```

3. **Jalankan *development server*:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) untuk melihat **Landing Page** atau akses langsung [http://localhost:3000/market](http://localhost:3000/market) untuk membuka **Market Terminal**.

4. **Verifikasi Tipe TypeScript & Build Produksi (Opsional):**
   ```bash
   # Cek validitas tipe TypeScript (0 error)
   npx tsc --noEmit

   # Buat build produksi yang teroptimasi
   npm run build

   # Jalankan server produksi
   npm start
   ```

---

## 📖 How to Use

1. **Eksplorasi dari Landing Page (`/`)**:
   - Gunakan kotak pencarian di bagian Hero atau klik salah satu chip cepat (`BBCA`, `BMRI`, `NVDA`, `AAPL`, `BTC-USD`) untuk langsung membuka analisis emiten tersebut di halaman `/market?ticker=SYMBOL`.
   - Klik salah satu dari 4 kartu pada seksi **Live Market Snapshot** untuk melihat grafik penuh dan indikator teknikalnya.
2. **Pencarian Saham Global Tanpa Batas (`Ctrl + K` / `Cmd + K`)**:
   - Tekan `Ctrl + K` dari halaman mana pun untuk membuka modal pencarian global.
   - Ketik 4 huruf kode saham Indonesia (misal: `BBRI`, `ANTM`, `BREN`, `TLKM`, `GOTO`) — sistem secara otomatis memprioritaskan emiten **BEI (`.JK`)** di urutan teratas, sekaligus menampilkan saham global dari `NASDAQ`, `NYSE`, `KRX`, `ASX`, maupun `CRYPTO`.
3. **Membaca Grafik & Indikator Teknikal (`01 / 04 — OVERVIEW`)**:
   - Pada Kartu Orbit di sebelah kanan, pilih *timeframe* (`1D`, `1W`, `1M`, `1Y`, `ALL`) dan ganti mode tampilan antara **Area** atau **Candle (OHLC)**.
   - Klik tombol **SMA 20** (kuning/amber) dan **EMA 50** (biru/cyan) untuk menampilkan garis *Moving Average* di atas grafik.
   - Perhatikan badge **RSI (14)** di kanan atas grafik untuk mendeteksi kondisi *Overbought* (`> 70`), *Oversold* (`< 30`), atau *Neutral*, serta amati bar distribusi volume dan sinyal *Momentum MA* di bagian bawah kartu.
4. **Komparasi Saham & Kalkulator Lot BEI (`03 / 04 — COMPARE & SIMULATOR`)**:
   - Gunakan navigasi cepat di header kanan atas (`01`–`04`) untuk melompat ke seksi **03 — COMPARE & SIMULATOR**.
   - Pilih saham pembanding kedua untuk melihat grafik perbandingan *return* (`%`) secara *head-to-head*.
   - Di panel sebelah kanan, masukkan jumlah **Lot** (otomatis `1 Lot = 100 Lembar` untuk saham `.JK`) atau jumlah **Unit**, lalu geser *slider* **Simulasi Target Profit** untuk menghitung estimasi nilai investasi Anda.

---

## 🔌 Data Sources & Architecture

### 1. Server-Side Yahoo Finance v8 Chart Proxy (`/api/stock`)
- Menghubungi endpoint resmi `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}` dari sisi server Next.js dengan header `User-Agent` standar sehingga bebas dari kendala blokir CORS di browser.
- Melakukan normalisasi simbol otomatis (menambahkan `.JK` untuk ticker saham Indonesia, `.KS` untuk Korea, `.AX` untuk Australia, dan `-USD` untuk kripto).
- Mengekstrak harga pasar reguler, *previous close*, *day high/low*, *52-week high/low*, volume transaksi, deret historis OHLC + volume, serta status pasar asli (`REGULAR`, `CLOSED`, `PRE`, `POST`).
- Saat pasar sedang tutup (`marketState !== "REGULAR"`), aplikasi menampilkan badge **`MARKET CLOSED · HARGA PENUTUPAN RESMI`** dan menghentikan *polling* yang tidak perlu.

### 2. Parallel IDX-Priority Search & News Proxy (`/api/search`)
- Menghubungi `https://query2.finance.yahoo.com/v1/finance/search` dengan *debounce* 300ms di sisi klien.
- Jika pengguna mengetik kueri 4 huruf (pola ticker BEI), route melakukan pencarian paralel dengan akhiran `.JK` agar saham Bursa Efek Indonesia selalu tampil di peringkat teratas.
- Mengekstrak daftar berita terbaru (`news`) lengkap dengan metadata penerbit dan waktu rilis untuk ditampilkan pada seksi `04 / 04 — MARKET NEWS`.

### 3. Resilient Deterministic Fallback (`src/data/mockStocks.ts`)
- Apabila jaringan lokal sedang *offline* atau koneksi ke server Yahoo Finance mengalami pembatasan (*rate-limit*), sistem secara mulus beralih ke profil data deterministik di `src/data/mockStocks.ts` (tanpa angka acak `Math.random()`) sehingga antarmuka, grafik, dan indikator teknikal tetap berfungsi 100% tanpa *crash*.

---

## 🗺️ Future Roadmap

- [x] **Multi-Asset Portfolio PnL Tracker**: Pencatatan transaksi beli/jual multi-mata uang dengan kalkulasi *Average Price*, *Unrealized PnL*, filter kategori, dan ekspor JSON/CSV.
- [x] **Mobile-First Responsive UI & Home Portfolio Widget**: Optimasi *touch-target*, tinggi grafik adaptif di layar ponsel, serta widget ringkasan portofolio di beranda.
- [ ] **Enhanced Global Command Palette (`Ctrl+K`)**: Aksi cepat melalui keyboard untuk mengganti *timeframe*, mengaktifkan indikator SMA/EMA, dan menavigasi seksi halaman.
- [ ] **Additional Technical Oscillators**: Penambahan indikator *Bollinger Bands (20, 2)* dan *MACD (12, 26, 9)* pada kanvas `lightweight-charts`.
- [ ] **Cloud Sync & Price Alerts**: Sinkronisasi *Watchlist* lintas perangkat dan notifikasi browser saat harga menyentuh area *Support/Resistance* 52-Minggu.

---

## 🤝 Contributing & Author

Kontribusi, laporan *bug*, dan saran fitur baru sangat terbuka! Silakan lakukan *fork* pada repositori ini, buat *feature branch* baru (`git checkout -b feature/AmazingFeature`), lakukan *commit* perubahan Anda, dan ajukan *Pull Request*.

### Author
**Muhammad Nur Ilham**
- GitHub: [@ilhaammm18](https://github.com/ilhaammm18)
- Repository: [https://github.com/ilhaammm18/Market.Tracker.git](https://github.com/ilhaammm18/Market.Tracker.git)

---

## ⚠️ Disclaimer

> Aplikasi **Market.Tracker** dibuat untuk tujuan **edukasi, riset teknikal/fundamental, dan demonstrasi portofolio rekayasa perangkat lunak**. Seluruh informasi dan indikator yang ditampilkan **bukan** merupakan saran keuangan atau ajakan membeli/menjual efek. Keputusan investasi sepenuhnya berada di tangan pengguna.

---

<div align="center">
  <b>MIT License © 2026 Muhammad Nur Ilham (@ilhaammm18)</b>
</div>
