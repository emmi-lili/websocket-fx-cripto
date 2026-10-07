import { useMemo, useState } from 'react'
import {
  useCryptoPrice,
  useKlines,
  useSideQuotes,
  useTicker24h,
} from './useCryptoPrice'

const CRIPTOS = [
  { symbol: 'BTCUSDT', nombre: 'Bitcoin', short: 'BTC', color: '#f7931a' },
  { symbol: 'ETHUSDT', nombre: 'Ethereum', short: 'ETH', color: '#627eea' },
  { symbol: 'BNBUSDT', nombre: 'BNB', short: 'BNB', color: '#f0b90b' },
  { symbol: 'SOLUSDT', nombre: 'Solana', short: 'SOL', color: '#9945ff' },
  { symbol: 'XRPUSDT', nombre: 'XRP', short: 'XRP', color: '#23292f' },
  { symbol: 'ADAUSDT', nombre: 'Cardano', short: 'ADA', color: '#0033ad' },
  { symbol: 'DOGEUSDT', nombre: 'Dogecoin', short: 'DOGE', color: '#c2a633' },
]

/** Tipo de cambio referencial BCB (USD → BOB). */
const TC_BCB = 6.96

const QUICK = [0.1, 0.5, 1, 5]
const SIDE_SYMBOLS = ['ETHUSDT', 'SOLUSDT']

const fmtBOB = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const fmtUSD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const fmtPct = new Intl.NumberFormat('es-BO', {
  signDisplay: 'exceptZero',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const ESTADOS = {
  conectando: { texto: 'Conectando…', clase: 'conectando' },
  conectado: { texto: 'Binance WebSocket Conectado', clase: 'conectado' },
  desconectado: { texto: 'Desconectado', clase: 'desconectado' },
  error: { texto: 'Error de conexión', clase: 'error' },
}

function CoinGlyph({ short, color, size = 28 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    className: 'coin-glyph',
    'aria-hidden': true,
  }

  if (short === 'BTC') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="15" fill={color} />
        <path
          fill="#fff"
          d="M18.2 14.2c.9-.5 1.4-1.2 1.3-2.3-.2-1.5-1.4-2-2.8-2.2V7.8h-1.5v1.8h-1.2V7.8h-1.5v1.9H9.8v1.7h1.1c.6 0 .7.2.7.7v7.1c0 .4-.1.6-.6.6H9.8v1.8h2.7v1.9h1.5v-1.9h1.2v1.9h1.5v-1.9c2 .1 3.5-.5 3.7-2.4.2-1.3-.5-2.1-1.7-2.5zm-3.2-2.8h1.5c.8 0 1.7.1 1.7 1.1s-1 1.2-1.9 1.2h-1.3v-2.3zm1.7 7.4h-1.7v-2.6h1.7c1.1 0 2.1.2 2.1 1.3s-1 1.3-2.1 1.3z"
        />
      </svg>
    )
  }

  if (short === 'ETH') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="15" fill={color} />
        <path fill="#fff" opacity=".85" d="M16 6.5l-.3.9v11.3l.3.3 6.5-3.9z" />
        <path fill="#fff" d="M16 6.5L9.5 15.1l6.5 3.9z" />
        <path fill="#fff" opacity=".85" d="M16 19.9l-.2.2v5.1l.2.6 6.5-9.2z" />
        <path fill="#fff" d="M16 25.8v-5.9l-6.5-3.3z" />
      </svg>
    )
  }

  if (short === 'SOL') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="15" fill={color} />
        <path
          fill="#fff"
          d="M10.2 19.8c.2-.2.4-.3.7-.3h11.4c.4 0 .6.5.3.8l-1.4 1.4c-.2.2-.4.3-.7.3H9.1c-.4 0-.6-.5-.3-.8zm0-9.2c.2-.2.4-.3.7-.3h11.4c.4 0 .6.5.3.8l-1.4 1.4c-.2.2-.4.3-.7.3H9.1c-.4 0-.6-.5-.3-.8zm12.1 3.8c-.2-.2-.4-.3-.7-.3H10.2c-.4 0-.6.5-.3.8l1.4 1.4c.2.2.4.3.7.3h11.4c.4 0 .6-.5.3-.8z"
        />
      </svg>
    )
  }

  if (short === 'USDT') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="15" fill={color} />
        <path
          fill="#fff"
          d="M17.4 14.7v7.1c-2.3.4-4.5 0-4.8 0v-7.1H8.5v-1.9c4.2.8 8.7.8 13 0v1.9zm1.7-5.2c-2.4-.3-4.8-.3-7.2 0v2.1c2.4-.3 4.8-.3 7.2 0z"
        />
      </svg>
    )
  }

  const letter = short.slice(0, 1)
  return (
    <svg {...common}>
      <circle cx="16" cy="16" r="15" fill={color} />
      <text
        x="16"
        y="17"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="inherit"
      >
        {letter}
      </text>
    </svg>
  )
}

function Sparkline({ points, color = '#6366f1' }) {
  if (!points?.length) {
    return <div className="spark-empty">Cargando tendencia…</div>
  }

  const w = 320
  const h = 120
  const pad = 8
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2)
    const y = h - pad - ((p - min) / span) * (h - pad * 2)
    return [x, y]
  })

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const area = `${line} L${coords.at(-1)[0]},${h} L${coords[0][0]},${h} Z`

  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" />
    </svg>
  )
}

function tiempoRelativo(ts) {
  if (!ts) return 'sin datos'
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 5) return 'hace instantes'
  if (s < 60) return `hace ${s}s`
  return `hace ${Math.floor(s / 60)} min`
}

export default function App() {
  const [cripto, setCripto] = useState(CRIPTOS[0])
  const [tc, setTc] = useState(TC_BCB)
  const [cantidad, setCantidad] = useState(1)

  const { price, prevPrice, status, lastUpdate } = useCryptoPrice(cripto.symbol)
  const ticker = useTicker24h(cripto.symbol)
  const klines = useKlines(cripto.symbol)
  const sideQuotes = useSideQuotes(SIDE_SYMBOLS)

  const precioBOB = price != null ? price * tc : null
  const totalBOB = precioBOB != null ? precioBOB * cantidad : null
  const totalUSD = price != null ? price * cantidad : null

  const tendencia = useMemo(() => {
    if (price == null || prevPrice == null) return 'neutral'
    if (price > prevPrice) return 'sube'
    if (price < prevPrice) return 'baja'
    return 'neutral'
  }, [price, prevPrice])

  const changePct = ticker?.changePct
  const estado = ESTADOS[status] || ESTADOS.conectando

  const otras = [
    {
      key: 'ETH',
      symbol: 'ETHUSDT',
      nombre: 'ETH/BOB',
      color: '#627eea',
      usd: sideQuotes.ETHUSDT,
    },
    {
      key: 'USDT',
      symbol: 'USDT',
      nombre: 'USDT/BOB',
      color: '#26a17b',
      usd: 1,
    },
    {
      key: 'SOL',
      symbol: 'SOLUSDT',
      nombre: 'SOL/BOB',
      color: '#9945ff',
      usd: sideQuotes.SOLUSDT,
    },
  ]

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="36" height="36">
              <circle cx="20" cy="20" r="20" fill="#5b4dff" />
              <path
                d="M11 24 L17 16 L22 20 L29 12"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="29" cy="12" r="2.2" fill="#fff" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">CriptoBOB</span>
          </div>
        </div>

        <div className="topbar-status">
          <div className={`ws-status ${estado.clase}`}>
            <span className="punto" />
            {estado.texto}
          </div>
          <span className="actualizado">Actualizado: {tiempoRelativo(lastUpdate)}</span>
        </div>
      </header>

      <section className="hero-copy">
        <h1>Cripto → Bolivianos</h1>
        <p>Conversor en tiempo real vía WebSocket de Binance. Tipo de cambio referencial BCB.</p>
      </section>

      <nav className="selector" aria-label="Seleccionar criptomoneda">
        {CRIPTOS.map((c) => {
          const activo = c.symbol === cripto.symbol
          return (
            <button
              key={c.symbol}
              type="button"
              className={`chip ${activo ? 'activo' : ''}`}
              style={
                activo
                  ? { borderColor: c.color, background: `${c.color}14`, color: '#0f172a' }
                  : undefined
              }
              onClick={() => setCripto(c)}
            >
              <CoinGlyph short={c.short} color={c.color} size={22} />
              {c.nombre}
            </button>
          )
        })}
      </nav>

      <div className="layout">
        <main className="panel converter">
          <div className="panel-head">
            <div className="moneda">
              <CoinGlyph short={cripto.short} color={cripto.color} size={40} />
              <div>
                <div className="moneda-nombre">
                  {cripto.nombre} <span>{cripto.symbol}</span>
                </div>
                <div className="moneda-meta">Par Binance · USDT ≈ USD</div>
              </div>
            </div>
            {changePct != null && (
              <span className={`change ${changePct >= 0 ? 'up' : 'down'}`}>
                {fmtPct.format(changePct)}%
              </span>
            )}
          </div>

          <div className={`precio-principal ${tendencia}`}>
            {precioBOB != null ? (
              <span className="precio-valor">{fmtBOB.format(precioBOB)}</span>
            ) : (
              <span className="precio-cargando">Esperando precio…</span>
            )}
          </div>
          <div className="precio-usd">
            {price != null ? (
              <>
                {fmtUSD.format(price)} USD
                <span className="sep">·</span>
                1 {cripto.short} = {fmtUSD.format(price)}
              </>
            ) : (
              '—'
            )}
          </div>

          <div className="conversor">
            <div className="campo">
              <div className="campo-label-row">
                <label htmlFor="cantidad">Cantidad de {cripto.nombre}</label>
                <div className="quick">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={cantidad === q ? 'on' : ''}
                      onClick={() => setCantidad(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="cantidad"
                type="number"
                min="0"
                step="any"
                value={cantidad}
                onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="campo">
              <label htmlFor="tc">Tipo de cambio BCB (USD → BOB)</label>
              <div className="tc-input">
                <span>Bs</span>
                <input
                  id="tc"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tc}
                  onChange={(e) => setTc(parseFloat(e.target.value) || 0)}
                  aria-label="Tipo de cambio referencial BCB"
                />
                <em>referencial</em>
              </div>
            </div>
          </div>

          <div className="resultado">
            <div className="resultado-fila">
              <span>Total equivalente en USD</span>
              <strong>{totalUSD != null ? fmtUSD.format(totalUSD) : '—'}</strong>
            </div>
            <div className="resultado-fila destacado">
              <span>Total en Bolivianos</span>
              <strong>{totalBOB != null ? fmtBOB.format(totalBOB) : '—'}</strong>
            </div>
          </div>

          <footer className="panel-foot">
            <span>
              {lastUpdate
                ? `Última actualización: ${new Date(lastUpdate).toLocaleTimeString('es-BO')}`
                : 'Sin datos todavía'}
            </span>
            <span>Sin comisiones de red</span>
          </footer>
        </main>

        <aside className="sidebar">
          <section className="panel">
            <div className="panel-head compact">
              <h2>Tendencia 24h ({cripto.short}/USD)</h2>
              {changePct != null && (
                <span className={`change ${changePct >= 0 ? 'up' : 'down'}`}>
                  {fmtPct.format(changePct)}% hoy
                </span>
              )}
            </div>
            <Sparkline points={klines} color="#6366f1" />
            <div className="spark-meta">
              <span>
                Mín 24h
                <strong>{ticker ? fmtUSD.format(ticker.low) : '—'}</strong>
              </span>
              <span>
                Máx 24h
                <strong>{ticker ? fmtUSD.format(ticker.high) : '—'}</strong>
              </span>
            </div>
          </section>

          <section className="panel">
            <h2>Tipo de cambio BCB</h2>
            <div className="bcb-ref">
              <div>
                <strong>Referencial BCB</strong>
                <small>USD → BOB</small>
              </div>
              <em>Bs {TC_BCB.toFixed(2)}</em>
            </div>
          </section>

          <section className="panel">
            <h2>Otras cotizaciones populares</h2>
            <ul className="quotes">
              {otras.map((q) => (
                <li key={q.key}>
                  <div className="quote-left">
                    <CoinGlyph short={q.key} color={q.color} size={28} />
                    <span>{q.nombre}</span>
                  </div>
                  <strong>
                    {q.usd != null ? fmtBOB.format(q.usd * tc) : '—'}
                  </strong>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <p className="nota">
        El precio proviene del par {cripto.symbol} en Binance (USDT ≈ USD). El tipo de
        cambio a bolivianos usa la referencia del BCB (Bs {TC_BCB.toFixed(2)}) y es editable.
      </p>

      <footer className="site-foot">
        <span>© {new Date().getFullYear()} CriptoBOB · Datos: Binance API</span>
        <nav>
          <a href="#terminos">Términos</a>
          <a href="#privacidad">Privacidad</a>
          <a href="https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams" target="_blank" rel="noreferrer">
            WebSocket API
          </a>
        </nav>
      </footer>
    </div>
  )
}
