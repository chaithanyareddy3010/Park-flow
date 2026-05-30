'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function ProfileManagerPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('user')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setFullName(profile.full_name || '')
          setPhone(profile.phone || '')
          setRole(profile.role || 'user')
        }
      } catch (err) {
        console.error('Error loading user profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user.id)

      if (updateErr) {
        toast.error(`Failed to update profile: ${updateErr.message}`)
      } else {
        toast.success('Profile saved successfully!')
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-2xl mx-auto animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Account Settings</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details and account settings.
        </p>
      </div>

      <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 rounded-2xl shadow-sm dark:shadow-xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          Personal Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Read only) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Email Address (Cannot change)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl text-slate-500 cursor-not-allowed text-sm font-medium"
            />
          </div>

          {/* Role Status (Read only) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              System Access Level
            </label>
            <input
              type="text"
              disabled
              value={role.toUpperCase()}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl text-slate-500 cursor-not-allowed text-sm font-bold uppercase tracking-wider"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-900 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-semibold"
              placeholder="John Doe"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-900 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-semibold"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-650/10 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center space-x-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Saving changes...</span>
              </span>
            ) : (
              'Save Profile Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
