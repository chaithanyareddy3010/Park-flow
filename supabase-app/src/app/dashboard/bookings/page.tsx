'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function BookingsHistoryPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])

  // Tracking which bookings are checking out
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null)

  async function loadBookings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_slots (
            slot_number,
            slot_type,
            parking_lots (
              name
            )
          ),
          vehicles (
            vehicle_number,
            vehicle_type
          )
        `)
        .eq('user_id', userId)
        .order('entry_time', { ascending: false })

      if (data) {
        setBookings(data)
      }
    } catch (err) {
      console.error('Error fetching bookings history:', err)
    }
  }

  useEffect(() => {
    async function initUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)
        await loadBookings(user.id)
      } catch (err) {
        console.error('Init user error:', err)
      } finally {
        setLoading(false)
      }
    }

    initUser()
  }, [])

  const handleCheckout = async (bookingId: string) => {
    setCheckingOutId(bookingId)

    try {
      const checkoutTime = new Date().toISOString()

      // Update exit_time and checkout_status to pending
      const { error } = await supabase
        .from('bookings')
        .update({ 
          exit_time: checkoutTime,
          checkout_status: 'pending'
        })
        .eq('id', bookingId)

      if (error) {
        toast.error(`Failed to request checkout: ${error.message}`)
        setCheckingOutId(null)
        return
      }

      toast.success('Checkout request submitted! Pending Admin approval.')

      // Reload historical records
      if (user) {
        await loadBookings(user.id)
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected checkout error occurred.')
    } finally {
      setCheckingOutId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">My Parking History</h1>
        <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">
          Track past visits, active sessions, and pricing logs.
        </p>
      </div>

      <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden">
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  <th className="py-4 px-6 font-bold">Vehicle</th>
                  <th className="py-4 px-6 font-bold">Lot & Spot</th>
                  <th className="py-4 px-6 font-bold">Entry Time</th>
                  <th className="py-4 px-6 font-bold">Exit Time</th>
                  <th className="py-4 px-6 font-bold">Fee</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-350">
                {bookings.map((booking) => {
                  const isActive = booking.status === 'active'
                  const vehicleTypeEmoji =
                    booking.vehicles?.vehicle_type === 'bike' ? '🏍️' : 
                    booking.vehicles?.vehicle_type === 'truck' ? '🚚' : '🚗'

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{vehicleTypeEmoji}</span>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{booking.vehicles?.vehicle_number}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{booking.vehicles?.vehicle_type}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{booking.parking_slots?.parking_lots?.name}</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          Spot #{booking.parking_slots?.slot_number} ({booking.parking_slots?.slot_type})
                        </p>
                      </td>

                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(booking.entry_time).toLocaleString()}
                      </td>

                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                        {booking.exit_time ? new Date(booking.exit_time).toLocaleString() : '—'}
                      </td>

                      <td className="py-4 px-6">
                        {booking.fee_amount ? (
                          <span className="font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(booking.fee_amount).toFixed(2)}</span>
                        ) : isActive ? (
                          <span className="text-indigo-650 dark:text-indigo-400 text-xs italic">Calculating...</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-650">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          booking.status === 'active'
                            ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400'
                            : booking.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleCheckout(booking.id)}
                            disabled={checkingOutId === booking.id || booking.checkout_status === 'pending'}
                            className={`text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md ${
                              booking.checkout_status === 'pending'
                                ? 'bg-slate-400 dark:bg-slate-800 shadow-none cursor-not-allowed text-slate-200 dark:text-slate-400'
                                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                            }`}
                          >
                            {booking.checkout_status === 'pending' ? (
                              <span>Pending Approval</span>
                            ) : checkingOutId === booking.id ? (
                              <span className="flex items-center space-x-2">
                                <div className="w-3.5 h-3.5 border border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>Requesting...</span>
                              </span>
                            ) : (
                              'Check Out'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-full border border-slate-200 dark:border-slate-900 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-550">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-lg">No parking sessions yet</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mt-1">
                Your booking records are clean. Park somewhere to start history.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
