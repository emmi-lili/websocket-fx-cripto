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
