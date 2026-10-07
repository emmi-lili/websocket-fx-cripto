# CriptoBOB

Real-time cryptocurrency to Bolivian Boliviano (BOB) converter.

Live prices come from Binance WebSocket streams. You can convert BTC, ETH, BNB, SOL, XRP, ADA, and DOGE to BOB using the BCB referential USD → BOB rate (editable).

## Features

- Live prices via Binance WebSocket (`@trade` streams)
- Convert crypto → USD → BOB with the BCB referential exchange rate
- Quick amount buttons and multi-coin selector
- 24h trend sparkline, min/max, and percent change
- Side quotes for ETH, USDT, and SOL in BOB
- Connection status and last-update indicator

## Stack

- React 18
- Vite
- Binance Spot WebSocket + REST API

## Getting started

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

## How it works

1. The app subscribes to Binance trade streams for the selected pair (e.g. `btcusdt@trade`).
2. The latest USDT price is treated as ≈ USD.
3. That amount is multiplied by the BCB referential USD → BOB rate (default `11.97`, editable).
4. REST endpoints fill in 24h ticker stats, hourly klines for the chart, and secondary quotes.

## Notes

- Prices are market data only — network fees and trading commissions are not included.
- The BCB rate is a reference default and can be adjusted in the UI.
- Requires network access to Binance (`stream.binance.com` and `api.binance.com`).

## License

Private project.
