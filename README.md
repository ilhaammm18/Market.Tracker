# Global Stock Intelligence & Real-Time Tracker 📈🌐

Aplikasi web intelijen saham global modern, interaktif, dan beranimasi halus terinspirasi oleh standar desain fintech premium papan atas.

## Fitur Utama

1. **Fintech Visual Theme & Premium UI/UX:**
   - Deep Midnight Navy Blue Gradient (`#040914` ke `#0A192F`) dengan radial glow halus.
   - Gold/Amber Glow (`#F5B700`) untuk ticker primer, garis grafik, dan aksen penting.
   - Emerald Green (`#10B981`) untuk pergerakan positif & Rose Red (`#F43F5E`) untuk penurunan.
   - Cyan Nodes (`#06B6D4`) untuk titik orbital berputar.
   - Tipografi: Plus Jakarta Sans / Inter untuk interface, JetBrains Mono untuk angka harga, persentase, dan tanggal.

2. **Hero Section dengan Interactive Orbital Animation:**
   - **Identitas Saham (Kiri):** Subtitle kategori bergaris emas, Ticker raksasa (6rem - 8rem) dengan animasi transisi huruf Framer Motion, nama lengkap & deskripsi, deretan pill badges, serta Intelligence Brief callout box.
   - **Orbital Price Card (Kanan):** 2 ring orbit konsentris dengan titik node cyan & emas yang berputar perlahan mengelilingi kartu harga glassmorphism melayang. Dilengkapi live pulse green indicator, harga multi-mata uang otomatis (Rp, USD, ₩, A$), badge persentase perubahan harian, dan grafik Area Chart interaktif berwarna kuning emas dengan pemilih rentang waktu (1D, 1W, 1M, 1Y, ALL).

3. **Live Global Ticker Tape:**
   - Baris berjalan (marquee) mulus dengan pergerakan harga real-time saham populer lokal dan internasional (BMRI, BBCA, AAPL, NVDA, VOO, Samsung, BHP, BTC, dll). Klik untuk langsung menganalisis saham tersebut.

4. **Bento Grid Fundamental & Statistik:**
   - Market Cap (Kapitalisasi Pasar & Tier).
   - P/E Ratio & Valuasi TTM dengan EPS.
   - Rentang 52-Minggu (52-Week High / Low slider progress indicator).
   - Volume Harian & Indikator Likuiditas Tier-1.
   - Dividend Yield & Estimasi Cash Flow.
   - Beta & Profil Risiko Volatilitas.

5. **Multi-Market Explorer & Watchlist Drawer:**
   - Filter bursa: BEI (Indonesia), Wall Street (US), KRX (Korea), ASX (Australia), Global ETF, dan Kripto.
   - Fitur simpan/hapus Watchlist yang tersimpan otomatis di `LocalStorage`.

6. **Integrasi Data Real-Time & Arsitektur API:**
   - Endpoint Next.js `/api/stock` dengan dukungan Finnhub API / Twelve Data API.
   - Smart Stochastic Simulation Fallback Engine: Menghasilkan fluktuasi harga mikro real-time secara dinamis sehingga aplikasi dapat langsung digunakan tanpa setup API key.
   - Mekanisme Auto-Polling 12 detik.
   - Modal konfigurasi API Key opsional.
   - Footer dengan stempel tanggal hari ini dan disclaimer regulasi.

## Menjalankan Aplikasi

```bash
# Menjalankan server development
npm run dev

# Membangun produksi
npm run build

# Menjalankan server produksi
npm start
```
Akses di browser pada: `http://localhost:3000`

