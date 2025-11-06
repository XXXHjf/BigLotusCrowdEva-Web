/**
 * API 请求 Hook
 */

import { useState, useEffect, useCallback } from 'react'
import type { ApiResponse } from '../types'
import { handleError } from '../utils/error'

interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: unknown) => void
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: unknown | null
  execute: (...args: unknown[]) => Promise<void>
  reset: () => void
}

/**
 * 通用 API 请求 Hook
 */
export function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {},
): UseApiResult<T> {
  const { immediate = false, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)

  const execute = useCallback(
    async (...args: unknown[]) => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiFunction(...args)
        setData(response.data)
        onSuccess?.(response.data)
      } catch (err) {
        setError(err)
        handleError(err as { code: number | string; message: string })
        onError?.(err)
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, onSuccess, onError],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
