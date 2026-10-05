import { useMemo, useState } from 'react'
import { useCryptoPrice } from './useCryptoPrice'

const CRIPTOS = [
  { symbol: 'BTCUSDT', nombre: 'Bitcoin', icono: '₿', color: '#f7931a' },
  { symbol: 'ETHUSDT', nombre: 'Ethereum', icono: 'Ξ', color: '#627eea' },
  { symbol: 'BNBUSDT', nombre: 'BNB', icono: 'BNB', color: '#f3ba2f' },
  { symbol: 'SOLUSDT', nombre: 'Solana', icono: 'SOL', color: '#14f195' },
  { symbol: 'XRPUSDT', nombre: 'XRP', icono: 'XRP', color: '#23292f' },
  { symbol: 'ADAUSDT', nombre: 'Cardano', icono: 'ADA', color: '#0033ad' },
  { symbol: 'DOGEUSDT', nombre: 'Dogecoin', icono: 'DOGE', color: '#c2a633' },
]

const TC_OFICIAL_DEFECTO = 6.96

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

const ESTADOS = {
  conectando: { texto: 'Conectando…', clase: 'conectando' },
  conectado: { texto: 'En vivo', clase: 'conectado' },
  desconectado: { texto: 'Desconectado', clase: 'desconectado' },
  error: { texto: 'Error de conexión', clase: 'error' },
}

export default function App() {
  const [cripto, setCripto] = useState(CRIPTOS[0])
  const [tc, setTc] = useState(TC_OFICIAL_DEFECTO)
  const [cantidad, setCantidad] = useState(1)
  const { price, prevPrice, status, lastUpdate } = useCryptoPrice(cripto.symbol)

  const precioBOB = price != null ? price * tc : null
  const totalUSD = price != null ? price * cantidad : null
  const totalBOB = precioBOB != null ? precioBOB * cantidad : null

  const tendencia = useMemo(() => {
    if (price == null || prevPrice == null) return 'neutral'
    if (price > prevPrice) return 'sube'
    if (price < prevPrice) return 'baja'
    return 'neutral'
  }, [price, prevPrice])

  const estado = ESTADOS[status] || ESTADOS.conectando

  return (
    <div className="app">
      <header className="header">
        <h1>Cripto → Bolivianos</h1>
        <p className="sub">Precios en tiempo real vía WebSocket de Binance</p>
      </header>

      <div className="selector">
        {CRIPTOS.map((c) => (
          <button
            key={c.symbol}
            className={`chip ${c.symbol === cripto.symbol ? 'activo' : ''}`}
            style={c.symbol === cripto.symbol ? { borderColor: c.color, color: c.color } : undefined}
            onClick={() => setCripto(c)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <main className="card">
        <div className="card-top">
          <div className="moneda">
            <span style={{ color: cripto.color }}>{cripto.icono}</span>
            <div>
              <div className="moneda-nombre">{cripto.nombre}</div>
              <div className="moneda-par">{cripto.symbol}</div>
            </div>
          </div>
          <div className={`estado ${estado.clase}`}>
            <span className="punto" />
            {estado.texto}
          </div>
        </div>

        <div className={`precio-principal ${tendencia}`}>
          {precioBOB != null ? fmtBOB.format(precioBOB) : 'Esperando precio…'}
        </div>
        <div className="precio-usd">
          {price != null ? `${fmtUSD.format(price)} USD` : '—'}
        </div>

        <div className="conversor">
          <div className="campo">
            <label>Cantidad de {cripto.nombre}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={cantidad}
              onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="campo">
            <label>Tipo de cambio (USD → BOB)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tc}
              onChange={(e) => setTc(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="resultado">
          <div className="resultado-fila">
            <span>Total en USD</span>
            <strong>{totalUSD != null ? fmtUSD.format(totalUSD) : '—'}</strong>
          </div>
          <div className="resultado-fila destacado">
            <span>Total en Bolivianos</span>
            <strong>{totalBOB != null ? fmtBOB.format(totalBOB) : '—'}</strong>
          </div>
        </div>
        <footer className="card-footer">
          {lastUpdate
            ? `Última actualización: ${new Date(lastUpdate).toLocaleTimeString('es-BO')}`
            : 'Sin datos todavía'}
        </footer>
      </main>

      <p className="nota">
        El tipo de cambio a bolivianos es editable: ajústalo al oficial o al del mercado que uses.
      </p>
    </div>
  )
}
