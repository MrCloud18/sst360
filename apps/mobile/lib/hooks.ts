import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'

// Carga datos al entrar a la pantalla, con loading / error / refresh
export function useLoad<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fnRef = useRef(fn); fnRef.current = fn
  const run = useCallback(async () => {
    setError(null)
    try { setData(await fnRef.current()) }
    catch (e: any) { setError(e?.message?.includes('Network') ? 'Sin conexión. Revisa tu internet e inténtalo de nuevo.' : e?.message ?? 'Ocurrió un error inesperado.') }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useFocusEffect(useCallback(() => { run() }, [run]))
  return { data, loading, error, reload: run }
}
