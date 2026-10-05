import { useEffect, useRef, useState } from 'react'

/**
 * Precio en vivo vía WebSocket de Binance (@trade).
 * Doc: wss://stream.binance.com:9443/ws/<symbol>@trade
 */
export function useCryptoPrice(symbol) {
  const [price, setPrice] = useState(null)
  const [prevPrice, setPrevPrice] = useState(null)
  const [status, setStatus] = useState('conectando')
  const [lastUpdate, setLastUpdate] = useState(null)

  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  useEffect(() => {
    if (!symbol) return

    let cerrado = false
    setPrice(null)
    setPrevPrice(null)

    function conectar() {
      setStatus('conectando')
      const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!cerrado) setStatus('conectado')
      }

      ws.onmessage = (event) => {
        if (cerrado) return
        try {
          const data = JSON.parse(event.data)
          const nuevo = parseFloat(data.p)
          if (!Number.isNaN(nuevo)) {
            setPrice((anterior) => {
              setPrevPrice(anterior)
              return nuevo
            })
            setLastUpdate(data.T || Date.now())
          }
        } catch {
          /* ignoramos mensajes malformados */
        }
      }

      ws.onerror = () => {
        if (!cerrado) setStatus('error')
      }

      ws.onclose = () => {
        if (cerrado) return
        setStatus('desconectado')
        reconnectRef.current = setTimeout(conectar, 2000)
      }
    }

    conectar()

    return () => {
      cerrado = true
      clearTimeout(reconnectRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [symbol])

  return { price, prevPrice, status, lastUpdate }
}

/**
 * Variación 24h + min/max desde el ticker REST de Binance.
 */
export function useTicker24h(symbol) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!symbol) return
    let cancelado = false

    async function cargar() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
        )
        if (!res.ok) return
        const json = await res.json()
        if (cancelado) return
        setData({
          changePct: parseFloat(json.priceChangePercent),
          high: parseFloat(json.highPrice),
          low: parseFloat(json.lowPrice),
        })
      } catch {
        /* silencioso: el chart puede vivir sin esto */
      }
    }

    cargar()
    const id = setInterval(cargar, 60_000)
    return () => {
      cancelado = true
      clearInterval(id)
    }
  }, [symbol])

  return data
}

/**
 * Velas 1h de las últimas 24h para el sparkline.
 */
export function useKlines(symbol) {
  const [points, setPoints] = useState([])

  useEffect(() => {
    if (!symbol) return
    let cancelado = false

    async function cargar() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`
        )
        if (!res.ok) return
        const json = await res.json()
        if (cancelado) return
        setPoints(json.map((k) => parseFloat(k[4])))
      } catch {
        /* silencioso */
      }
    }

    cargar()
    const id = setInterval(cargar, 5 * 60_000)
    return () => {
      cancelado = true
      clearInterval(id)
    }
  }, [symbol])

  return points
}

/**
 * Cotizaciones auxiliares (REST, polling suave).
 */
export function useSideQuotes(symbols) {
  const [quotes, setQuotes] = useState({})
  const key = symbols.join(',')

  useEffect(() => {
    if (!symbols?.length) return
    let cancelado = false

    async function cargar() {
      try {
        const entries = await Promise.all(
          symbols.map(async (symbol) => {
            const res = await fetch(
              `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
            )
            if (!res.ok) return [symbol, null]
            const json = await res.json()
            return [symbol, parseFloat(json.price)]
          })
        )
        if (cancelado) return
        setQuotes(Object.fromEntries(entries))
      } catch {
        /* silencioso */
      }
    }

    cargar()
    const id = setInterval(cargar, 15_000)
    return () => {
      cancelado = true
      clearInterval(id)
    }
  }, [key])

  return quotes
}
