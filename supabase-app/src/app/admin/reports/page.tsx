'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

export default function ReportsAnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)

  // Chart datasets
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [vehicleDistribution, setVehicleDistribution] = useState<any[]>([])
  const [peakHours, setPeakHours] = useState<any[]>([])

  async function compileReports() {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          fee_amount,
          entry_time,
          exit_time,
          vehicles (
            vehicle_type
          )
        `)
        .eq('status', 'completed')

      if (error) throw error

      if (bookings) {
        // 1. Last 7 Days Revenue Trend
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - i)
          d.setHours(0, 0, 0, 0)
          return d
        }).reverse()

        const dailyRevenue = last7Days.map((day) => {
          const dateString = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const dayStart = day.getTime()
          const dayEnd = dayStart + 24 * 60 * 60 * 1000

          const dayBookings = bookings.filter((b: any) => {
            if (!b.exit_time) return false
            const checkOutTime = new Date(b.exit_time).getTime()
            return checkOutTime >= dayStart && checkOutTime < dayEnd
          })

          const revenue = dayBookings.reduce((sum, b: any) => sum + parseFloat(b.fee_amount || 0), 0)

          return {
            name: dateString,
            Revenue: parseFloat(revenue.toFixed(2)),
          }
        })

        setRevenueData(dailyRevenue)

        // 2. Vehicle Type Distribution
        const types = { car: 0, bike: 0, truck: 0 }
        bookings.forEach((b: any) => {
          const t = b.vehicles?.vehicle_type as keyof typeof types
          if (t && types[t] !== undefined) {
            types[t]++
          } else {
            types.car++
          }
        })

        const pieData = [
          { name: 'Cars', value: types.car },
          { name: 'Bikes', value: types.bike },
          { name: 'Trucks', value: types.truck },
        ]

        setVehicleDistribution(pieData)

        // 3. Peak Check-In Hours
        const hourCounts = Array.from({ length: 24 }, () => 0)
        bookings.forEach((b: any) => {
          const hour = new Date(b.entry_time).getHours()
          hourCounts[hour]++
        })

        const hoursList = hourCounts
          .map((count, hr) => {
            const displayHour = hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`
            const nextDisplayHour = (hr + 1) === 12 ? '12 PM' : (hr + 1) === 24 ? '12 AM' : (hr + 1) > 12 ? `${(hr + 1) - 12} PM` : `${hr + 1} AM`
            return {
              hourRange: `${displayHour} - ${nextDisplayHour}`,
              count,
              rawHour: hr,
            }
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setPeakHours(hoursList)
      }
    } catch (err) {
      console.error('Error compiling analytics reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    compileReports()
    // Observe theme status on mount
    const isDarkTheme = document.documentElement.classList.contains('dark')
    setIsDark(isDarkTheme)

    // Setup an observer to watch for theme changes dynamically
    const observer = new MutationObserver(() => {
      const isDarkTheme = document.documentElement.classList.contains('dark')
      setIsDark(isDarkTheme)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b']

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100">System Reports</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Financial statements, vehicle demographic analytics, and traffic optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-8 rounded-2xl shadow-sm dark:shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Revenue Trend (Last 7 Days)</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">Total cleared earnings (₹)</p>
          </div>
          <div className="h-80 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="Revenue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle distribution (1 col) */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-8 rounded-2xl shadow-sm dark:shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Vehicle Demographics</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">Active occupancy share</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="lg:col-span-3 bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 rounded-2xl shadow-sm dark:shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Peak Occupancy Hours</h2>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">Operational analysis displaying hourly check-in volume sorted by peak density.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-6">Check-In Hour Range</th>
                  <th className="py-3.5 px-6">Check-In Event Counts</th>
                  <th className="py-3.5 px-6 text-right">Traffic Load Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                {peakHours.length > 0 ? (
                  peakHours.map((hourObj, index) => {
                    const totalCounts = peakHours.reduce((sum, h) => sum + h.count, 0)
                    const loadFactor = totalCounts > 0 ? ((hourObj.count / totalCounts) * 100).toFixed(1) : '0.0'

                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">{hourObj.hourRange}</td>
                        <td className="py-4 px-6 font-semibold text-rose-600 dark:text-rose-455">{hourObj.count} check-ins</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            index === 0
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/25 dark:text-rose-400'
                              : 'bg-indigo-500/10 text-indigo-650 border border-indigo-500/25 dark:text-indigo-400'
                          }`}>
                            {loadFactor}% load density
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 font-semibold">
                      No operational logs found. Generate entries first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
