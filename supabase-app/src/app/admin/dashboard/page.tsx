'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  // Realtime Stats States
  const [stats, setStats] = useState({
    totalSlots: 0,
    occupiedCount: 0,
    availableCount: 0,
    todayRevenue: 0,
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  async function fetchDashboardData() {
    try {
      // 1. Fetch live slot counts
      const { data: slots } = await supabase
        .from('parking_slots')
        .select('id, status')

      let total = 0
      let occupied = 0
      let available = 0

      if (slots) {
        total = slots.length
        occupied = slots.filter((s: any) => s.status === 'occupied').length
        available = slots.filter((s: any) => s.status === 'available').length
      }

      // 2. Fetch today's revenue (bookings completed today)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('fee_amount')
        .eq('status', 'completed')
        .gte('exit_time', todayStart.toISOString())
        .lte('exit_time', todayEnd.toISOString())

      const revenue = todayBookings
        ? todayBookings.reduce((sum: number, b: any) => sum + parseFloat(b.fee_amount || 0), 0)
        : 0

      setStats({
        totalSlots: total,
        occupiedCount: occupied,
        availableCount: available,
        todayRevenue: revenue,
      })

      // 3. Fetch recent bookings (last 10)
      const { data: recent } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_slots (
            slot_number,
            parking_lots (
              name
            )
          ),
          vehicles (
            vehicle_number,
            vehicle_type
          ),
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recent) {
        setRecentBookings(recent)
      }
    } catch (err) {
      console.error('Error loading realtime admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Hook up Supabase Realtime subscriptions
  useEffect(() => {
    fetchDashboardData()

    const channel = supabase.channel('db-changes-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchDashboardData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>

        {/* Stats card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>

        {/* Table skeleton */}
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100">Live Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Real-time occupancy monitoring and system revenue tracking.
          </p>
        </div>
        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-2 w-fit animate-pulse self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          <span>Live Supabase Stream Active</span>
        </span>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Slots */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Slots Configured</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalSlots}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">spots</span>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Occupied Slots</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-rose-650 dark:text-rose-500">{stats.occupiedCount}</span>
            <span className="text-xs text-slate-400 dark:text-slate-555">
              ({stats.totalSlots > 0 ? ((stats.occupiedCount / stats.totalSlots) * 100).toFixed(0) : 0}% capacity)
            </span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Available Slots</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{stats.availableCount}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">spots free</span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-amber-600 dark:text-amber-500">₹{stats.todayRevenue.toFixed(2)}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">cleared today</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 rounded-2xl shadow-sm dark:shadow-xl p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">System Activity Feed</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time log of the last 10 system check-ins and check-outs.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Entry</th>
                <th className="py-3 px-4">Exit</th>
                <th className="py-3 px-4">Fee Charged</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => {
                  const isActive = booking.status === 'active'
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {booking.profiles?.full_name || 'Anonymous User'}
                      </td>
                      <td className="py-4 px-4 uppercase font-bold text-indigo-650 dark:text-indigo-400">
                        {booking.vehicles?.vehicle_number} ({booking.vehicles?.vehicle_type})
                      </td>
                      <td className="py-4 px-4">
                        {booking.parking_slots?.parking_lots?.name} (Spot #{booking.parking_slots?.slot_number})
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(booking.entry_time).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        {booking.exit_time ? new Date(booking.exit_time).toLocaleString() : '—'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {booking.fee_amount ? `₹${parseFloat(booking.fee_amount).toFixed(2)}` : isActive ? '—' : '₹0.00'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          booking.status === 'active'
                            ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400'
                            : booking.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-550'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No bookings logged yet. Real-time updates will print here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
