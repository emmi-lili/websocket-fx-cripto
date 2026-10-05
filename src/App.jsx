import { useState } from 'react'
import { useCryptoPrice } from './useCryptoPrice'

const TC_OFICIAL = 6.96

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

export default function App() {
  const [cantidad, setCantidad] = useState(1)
  const { price } = useCryptoPrice('BTCUSDT')

  const totalUSD = price != null ? price * cantidad : null
  const totalBOB = totalUSD != null ? totalUSD * TC_OFICIAL : null

  return (
    <div className="app">
      <header className="header">
        <h1>Cripto → Bolivianos</h1>
        <p className="sub">Precios en tiempo real vía WebSocket de Binance</p>
      </header>

      <main className="card">
        <div className="precio-principal">
          {price != null ? fmtBOB.format(price * TC_OFICIAL) : 'Esperando precio…'}
        </div>
        <div className="precio-usd">
          {price != null ? `${fmtUSD.format(price)} USD` : '—'}
        </div>

        <div className="campo">
          <label>Cantidad de Bitcoin</label>
          <input
            type="number"
            min="0"
            step="any"
            value={cantidad}
            onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
          />
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
      </main>
    </div>
  )
}
