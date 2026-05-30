'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Determine initial theme on mount
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setTheme('light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
      aria-label="Toggle light/dark theme"
    >
      <span className="flex items-center space-x-2">
        {theme === 'dark' ? (
          <>
            {/* Sun Icon */}
            <svg className="w-4 h-4 text-amber-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <span>Light Mode</span>
          </>
        ) : (
          <>
            {/* Moon Icon */}
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>Dark Mode</span>
          </>
        )}
      </span>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
        Theme
      </span>
    </button>
  )
}
