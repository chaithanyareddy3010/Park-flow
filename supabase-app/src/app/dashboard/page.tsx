'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardOverview() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [stats, setStats] = useState({ totalBookings: 0, totalSpent: 0 })
  const [duration, setDuration] = useState<string>('00:00:00')

  useEffect(() => {
    async function getDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)

        // 1. Fetch active booking
        const { data: active } = await supabase
          .from('bookings')
          .select(`
            *,
            parking_slots (
              slot_number,
              slot_type,
              parking_lots (
                name,
                location,
                hourly_rate_car,
                hourly_rate_bike,
                hourly_rate_truck
              )
            ),
            vehicles (
              vehicle_number,
              vehicle_type
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (active) {
          setActiveBooking(active)
        } else {
          setActiveBooking(null)
        }

        // 2. Fetch history for stats
        const { data: history } = await supabase
          .from('bookings')
          .select('fee_amount, status')
          .eq('user_id', user.id)

        if (history) {
          const totalBookings = history.length
          const totalSpent = history
            .filter((b: any) => b.status === 'completed' && b.fee_amount)
            .reduce((sum: number, b: any) => sum + parseFloat(b.fee_amount), 0)

          setStats({ totalBookings, totalSpent })
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    getDashboardData()
  }, [])

  // Timer effect for active booking
  useEffect(() => {
    if (!activeBooking) return

    const interval = setInterval(() => {
      const entryTime = new Date(activeBooking.entry_time).getTime()
      const now = new Date().getTime()
      const diffMs = now - entryTime

      if (diffMs < 0) return

      const hours = Math.floor(diffMs / 3600000)
      const minutes = Math.floor((diffMs % 3600000) / 60000)
      const seconds = Math.floor((diffMs % 60000) / 1000)

      const pad = (num: number) => num.toString().padStart(2, '0')
      setDuration(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeBooking])

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto animate-pulse">
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>

        {/* Stats card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>

        {/* Active booking skeleton */}
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Welcome back!</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Here is your live parking summary.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider uppercase">
            Total Parking Bookings
          </span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalBookings}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">sessions total</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider uppercase">
            Total Amount Spent
          </span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">₹{stats.totalSpent.toFixed(2)}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">across completed checkouts</span>
          </div>
        </div>
      </div>

      {/* Active Booking status */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-8 rounded-2xl shadow-sm dark:shadow-xl">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Active Parking Session</h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">Real-time status of your parked vehicle.</p>
          </div>
          {activeBooking ? (
            <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse self-start sm:self-center">
              Active Parked
            </span>
          ) : (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-center">
              No Active Session
            </span>
          )}
        </div>

        {activeBooking ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Session Timer */}
            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-900 p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Elapsed Time
              </span>
              <span className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-3 tracking-widest">
                {duration}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-2">Updating live</span>
            </div>

            {/* Parking details */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Location</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                  {activeBooking.parking_slots?.parking_lots?.name}
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400">
                  {activeBooking.parking_slots?.parking_lots?.location}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Slot Number</span>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  Slot #{activeBooking.parking_slots?.slot_number} ({activeBooking.parking_slots?.slot_type})
                </p>
              </div>
            </div>

            {/* Vehicle & Rates */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Vehicle Parked</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 uppercase">
                  {activeBooking.vehicles?.vehicle_number}
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 capitalize">
                  {activeBooking.vehicles?.vehicle_type}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Current Lot Rates</span>
                <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                  Car: ₹{parseFloat(activeBooking.parking_slots?.parking_lots?.hourly_rate_car).toFixed(2)}/hr | 
                  Bike: ₹{parseFloat(activeBooking.parking_slots?.parking_lots?.hourly_rate_bike).toFixed(2)}/hr | 
                  Truck: ₹{parseFloat(activeBooking.parking_slots?.parking_lots?.hourly_rate_truck).toFixed(2)}/hr
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-200 font-semibold text-lg">No active parking found</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs mx-auto mt-1">
                You do not have any vehicle checked-in right now. Book a slot to start!
              </p>
            </div>
            <Link
              href="/dashboard/book"
              className="inline-block mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              Book a Spot Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
