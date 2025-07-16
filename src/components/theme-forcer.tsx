'use client'

import { useEffect } from 'react'

export function ThemeForcer() {
  useEffect(() => {
    // Force consistent theme on production
    if (process.env.NODE_ENV === 'production') {
      // Remove any conflicting theme classes
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      
      // Ensure CSS variables are properly set
      const style = document.createElement('style')
      style.textContent = `
        :root {
          --background: 0 0% 100% !important;
          --foreground: 0 0% 3.9% !important;
          --card: 0 0% 100% !important;
          --card-foreground: 0 0% 3.9% !important;
          --primary: 0 0% 9% !important;
          --primary-foreground: 0 0% 98% !important;
          --border: 0 0% 89.8% !important;
          --input: 0 0% 89.8% !important;
        }
        
        body {
          background-color: white !important;
          color: #0f172a !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return null
}
