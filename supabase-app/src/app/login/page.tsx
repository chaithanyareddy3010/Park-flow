'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { login } from '@/app/auth/actions'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const initialState = {
  error: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Signing in...</span>
        </span>
      ) : (
        'Sign In'
      )}
    </button>
  )
}

function LoginForm() {
  const [state, formAction] = useFormState(login, initialState)
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 relative overflow-hidden">
      {/* Dynamic background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            ParkFlow
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Secure Parking Management System
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
          <h2 className="text-2xl font-bold text-slate-100 text-center">
            Sign in to your account
          </h2>

          {registered && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-emerald-400 text-xs text-center">
              Registration successful! Please sign in using your credentials.
            </div>
          )}

          {state?.error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-lg text-rose-400 text-xs text-center">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
