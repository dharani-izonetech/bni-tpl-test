import { useEffect, useRef, useState, useCallback } from 'react'

interface LiveScoreUpdate {
  type?: string
  match_id?: number
  innings_id?: number
  innings_number?: number
  total_runs?: number
  total_wickets?: number
  total_overs?: number
  ball?: {
    over: number
    ball: number
    runs: number
    extras: number
    type: string
    is_wicket: boolean
    commentary: string | null
  }
  target?: number | null
}

export const useMatchWebSocket = (matchId: string | number | null) => {
  const ws = useRef<WebSocket | null>(null)
  const [lastUpdate, setLastUpdate] = useState<LiveScoreUpdate | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const attempts = useRef(0)

  const connect = useCallback(() => {
    if (!matchId) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/match/${matchId}`

    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setIsConnected(true)
      attempts.current = 0
    }

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as LiveScoreUpdate
        if (data.type !== 'heartbeat') setLastUpdate(data)
      } catch {}
    }

    ws.current.onclose = () => {
      setIsConnected(false)
      if (attempts.current < 5) {
        attempts.current++
        reconnectTimer.current = setTimeout(connect, 2000 * attempts.current)
      }
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [matchId])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  const sendPing = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send('ping')
    }
  }, [])

  return { isConnected, lastUpdate, sendPing }
}
