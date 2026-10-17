import { useCallback, useEffect, useRef, useState } from 'react'
import type { Motor, SensorReading } from '../types'
import { makeReading } from '../data'

export function useSensorData(motors: Motor[], enabled: boolean, intervalMs = 2500) {
  const [history, setHistory] = useState<SensorReading[]>([])
  const updatesRef = useRef(0)
  const abnormalRef = useRef(0)
  const motorsRef = useRef(motors)
  useEffect(() => { motorsRef.current = motors }, [motors])
  const addReading = useCallback((motor?: Motor) => {
    const list = motorsRef.current
    if (!list.length) return
    const chosen = motor ?? list[Math.floor(Math.random() * list.length)]
    const next = makeReading(chosen)
    updatesRef.current += 1
    if (next.status !== 'Healthy') abnormalRef.current += 1
    setHistory(prev => [...prev, next].slice(-60))
    return next
  }, [])
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => { addReading() }, intervalMs)
    return () => window.clearInterval(timer)
  }, [enabled, intervalMs, addReading])
  return { history, setHistory, addReading, updatesRef, abnormalRef }
}
