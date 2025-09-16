"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface CacheContextType {
  get: <T>(key: string) => T | null
  set: <T>(key: string, data: T, ttl?: number) => void
  remove: (key: string) => void
  clear: () => void
  isExpired: (key: string) => boolean
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Record<string, CacheItem>>({})

  const get = useCallback(<T,>(key: string): T | null => {
    const item = cache[key]
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      // Remove expired item
      setCache(prev => {
        const newCache = { ...prev }
        delete newCache[key]
        return newCache
      })
      return null
    }

    return item.data as T
  }, [cache])

  const set = useCallback(<T,>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }
    setCache(prev => ({ ...prev, [key]: item }))
  }, [])

  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = { ...prev }
      delete newCache[key]
      return newCache
    })
  }, [])

  const clear = useCallback(() => {
    setCache({})
  }, [])

  const isExpired = useCallback((key: string): boolean => {
    const item = cache[key]
    if (!item) return true

    const now = Date.now()
    return now - item.timestamp > item.ttl
  }, [cache])

  return (
    <CacheContext.Provider value={{ get, set, remove, clear, isExpired }}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}

// Hook for cached API calls
export function useCachedApi<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; message?: string }>,
  cacheKey: string,
  ttl: number = DEFAULT_TTL
) {
  const cache = useCache()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (forceRefresh = false): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedData = cache.get<T>(cacheKey)
        if (cachedData !== null) {
          setIsLoading(false)
          return cachedData
        }
      }

      // Make API call
      const response = await apiCall()
      if (response.success && response.data) {
        cache.set(cacheKey, response.data, ttl)
        setIsLoading(false)
        return response.data
      } else {
        setError(response.message || 'API call failed')
        setIsLoading(false)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setIsLoading(false)
      return null
    }
  }, [apiCall, cacheKey, ttl, cache])

  const invalidate = useCallback(() => {
    cache.remove(cacheKey)
  }, [cache, cacheKey])

  return { execute, invalidate, isLoading, error }
}