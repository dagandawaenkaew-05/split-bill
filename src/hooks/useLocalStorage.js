import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // เบราว์เซอร์บล็อกการเก็บข้อมูล (เช่น private mode) ก็ข้ามไป
    }
  }, [key, value])

  return [value, setValue]
}