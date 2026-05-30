'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  role: 'user' | 'admin'
  fullName: string
  email: string
  logoutAction: any // form action
}

export default function Sidebar({ role, fullName, email, logoutAction }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Configure links based on user/admin role
  const links = role === 'admin'
    ? [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: 'Slot Map',
          href: '/admin/slots',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          ),
        },
        {
          label: 'All Bookings',
          href: '/admin/bookings',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          label: 'Manage Lots',
          href: '/admin/lots',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          label: 'Reports',
          href: '/admin/reports',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
      ]
    : [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
          ),
        },
        {
          label: 'Book a Slot',
          href: '/dashboard/book',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: 'My Bookings',
          href: '/dashboard/bookings',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          label: 'Profile',
          href: '/dashboard/profile',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
      ]

  const colorGrad = role === 'admin'
    ? 'from-rose-500 via-purple-500 to-amber-500'
    : 'from-indigo-500 via-purple-500 to-pink-500'

  const activeLinkStyle = role === 'admin'
    ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 font-bold border-l-4 border-rose-500'
    : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold border-l-4 border-indigo-500'

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="w-full md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-30 relative transition-colors duration-200">
        <Link href={role === 'admin' ? '/admin/dashboard' : '/dashboard'} className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${colorGrad}`}>
          ParkFlow
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar Navigation - Drawer on Mobile, Fixed Sidebar on Desktop */}
      <aside className={`fixed inset-y-0 left-0 transform md:relative md:translate-x-0 w-64 bg-slate-50 border-r border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 backdrop-blur-xl flex flex-col z-40 transition-all duration-300 md:shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header (Desktop only) */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-900 hidden md:flex flex-col">
          <Link href={role === 'admin' ? '/admin/dashboard' : '/dashboard'} className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${colorGrad}`}>
            ParkFlow
          </Link>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">
            {role === 'admin' ? 'Operations Terminal' : 'User Control Cabin'}
          </span>
        </div>

        {/* Links Navigation */}
        <nav className="p-4 space-y-1.5 flex-grow mt-4 md:mt-0">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? activeLinkStyle
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-white border-l-4 border-transparent'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900 space-y-4">
          {/* Light/Dark mode switcher */}
          <ThemeToggle />

          {/* Welcome User & Signout */}
          <div className="bg-slate-100 dark:bg-slate-950/20 p-4 border border-slate-200 dark:border-slate-900 rounded-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase border ${
                role === 'admin' 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-400' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-400'
              }`}>
                {fullName?.substring(0, 2) || email?.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{fullName || 'Operations Client'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{email}</p>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-900/30 bg-rose-950/5 dark:bg-rose-950/10 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-950/20 dark:hover:bg-rose-950/30 hover:border-rose-800 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-35 md:hidden"
        />
      )}
    </>
  )
}
