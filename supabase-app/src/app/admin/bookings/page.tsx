'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function BookingsControlPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [lots, setLots] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])

  // Search & Filter States
  const [searchPlate, setSearchPlate] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Check-In Form States
  const [showCheckInForm, setShowCheckInForm] = useState(false)
  const [checkInLotId, setCheckInLotId] = useState('')
  const [checkInSlots, setCheckInSlots] = useState<any[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [checkInUserId, setCheckInUserId] = useState('')
  const [newVehicle, setNewVehicle] = useState({
    owner_name: '',
    vehicle_number: '',
    vehicle_type: 'car',
    phone: '',
  })

  // Action states
  const [processing, setProcessing] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return
      setUser(currentUser)

      // 1. Fetch all lots
      const { data: lotsData } = await supabase.from('parking_lots').select('*')
      if (lotsData) {
        setLots(lotsData)
        if (lotsData.length > 0) setCheckInLotId(lotsData[0].id)
      }

      // 2. Fetch all user profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'user')
      if (profilesData) {
        setProfiles(profilesData)
        if (profilesData.length > 0) setCheckInUserId(profilesData[0].id)
      }

      await loadBookings()
    } catch (err) {
      console.error('Error loading admin bookings data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadBookings() {
    try {
      let query = supabase.from('bookings').select(`
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
        ),
        profiles (
          full_name,
          phone
        )
      `)

      if (dateFrom) {
        query = query.gte('entry_time', new Date(dateFrom).toISOString())
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('entry_time', toDate.toISOString())
      }

      const { data, error } = await query.order('entry_time', { ascending: false })

      if (error) throw error

      if (data) {
        let filtered = data

        if (filterStatus !== 'all') {
          filtered = filtered.filter((b: any) => b.status === filterStatus)
        }

        if (searchPlate) {
          filtered = filtered.filter((b: any) =>
            b.vehicles?.vehicle_number?.toLowerCase().includes(searchPlate.toLowerCase())
          )
        }

        setBookings(filtered)
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
    }
  }

  // Load slots whenever check-in lot is selected
  useEffect(() => {
    async function loadAvailableSlots() {
      if (!checkInLotId) return
      const { data } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('lot_id', checkInLotId)
        .eq('status', 'available')
        .order('slot_number', { ascending: true })

      if (data) {
        setCheckInSlots(data)
        if (data.length > 0) setSelectedSlotId(data[0].id)
      }
    }
    loadAvailableSlots()
  }, [checkInLotId])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [filterStatus, searchPlate, dateFrom, dateTo])

  // Checkout booking action
  const handleCheckout = async (bookingId: string) => {
    setProcessing(true)

    try {
      const checkoutTime = new Date().toISOString()

      // 1. Update exit_time
      const { error: exitErr } = await supabase
        .from('bookings')
        .update({ exit_time: checkoutTime })
        .eq('id', bookingId)

      if (exitErr) throw exitErr

      // 2. Call RPC to calculate fee
      const { data: fee, error: feeErr } = await supabase
        .rpc('calculate_fee', { p_booking_id: bookingId })

      if (feeErr) throw feeErr

      const calculatedFee = parseFloat(fee || 0)

      // 3. Finalize booking completed
      const { error: finalizeErr } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          fee_amount: calculatedFee,
          checkout_status: 'approved',
        })
        .eq('id', bookingId)

      if (finalizeErr) throw finalizeErr

      // 4. Create completed payment record
      await supabase.from('payments').insert({
        booking_id: bookingId,
        amount: calculatedFee,
        payment_method: 'cash',
        paid_at: checkoutTime,
        status: 'completed',
      })

      toast.success(`Checkout successfully finalized! Fee: ₹${calculatedFee.toFixed(2)}`)
      await loadBookings()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during checkout.')
    } finally {
      setProcessing(false)
    }
  }

  // Manual Check-In Submit
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlotId || !checkInUserId) {
      toast.error('Please select an available parking slot and user profile.')
      return
    }

    setProcessing(true)

    try {
      const { owner_name, vehicle_number, vehicle_type, phone } = newVehicle
      if (!owner_name || !vehicle_number) {
        toast.error('Please enter owner name and vehicle plate number.')
        setProcessing(false)
        return
      }

      let vehicleId = ''

      // 1. Insert vehicle if not exists
      const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('vehicle_number', vehicle_number.toUpperCase())
        .maybeSingle()

      if (existingVehicle) {
        vehicleId = existingVehicle.id
      } else {
        const { data: insertedVehicle, error: vehicleErr } = await supabase
          .from('vehicles')
          .insert({
            user_id: checkInUserId,
            owner_name,
            vehicle_number: vehicle_number.toUpperCase(),
            vehicle_type,
            phone: phone || null,
          })
          .select()
          .single()

        if (vehicleErr || !insertedVehicle) throw vehicleErr
        vehicleId = insertedVehicle.id
      }

      // 2. Insert booking
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          slot_id: selectedSlotId,
          vehicle_id: vehicleId,
          user_id: checkInUserId,
          entry_time: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single()

      if (bookingErr || !booking) throw bookingErr

      // 3. Update slot status to occupied
      await supabase
        .from('parking_slots')
        .update({ status: 'occupied' })
        .eq('id', selectedSlotId)

      toast.success('Manual vehicle check-in authorized successfully!')
      setShowCheckInForm(false)
      setNewVehicle({ owner_name: '', vehicle_number: '', vehicle_type: 'car', phone: '' })
      await loadBookings()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during manual check-in.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Bookings Control</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            System logs, search filters, and manual vehicle check-in tools.
          </p>
        </div>
        <button
          onClick={() => setShowCheckInForm(!showCheckInForm)}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-xl shadow-md shadow-rose-600/10 transition-all self-start sm:self-center"
        >
          {showCheckInForm ? 'Hide Form' : 'Manual Check-In'}
        </button>
      </div>

      {/* Manual Check-in Form */}
      {showCheckInForm && (
        <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-8 rounded-2xl shadow-sm dark:shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            Manual Vehicle Check-In
          </h2>
          <form onSubmit={handleCheckInSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Assign User Profile
              </label>
              <select
                value={checkInUserId}
                onChange={(e) => setCheckInUserId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            {/* Parking Lot selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Parking Lot
              </label>
              <select
                value={checkInLotId}
                onChange={(e) => setCheckInLotId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-855 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Slot selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Available Slot
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                disabled={checkInSlots.length === 0}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-855 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkInSlots.length > 0 ? (
                  checkInSlots.map((s) => (
                    <option key={s.id} value={s.id}>Spot #{s.slot_number} ({s.slot_type})</option>
                  ))
                ) : (
                  <option value="">No spots free</option>
                )}
              </select>
            </div>

            {/* Vehicle Owner Name */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Vehicle Owner Name
              </label>
              <input
                type="text"
                placeholder="E.g. John Doe"
                required
                value={newVehicle.owner_name}
                onChange={(e) => setNewVehicle({ ...newVehicle, owner_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold"
              />
            </div>

            {/* Plate Number */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                placeholder="E.g. NY-777A"
                required
                value={newVehicle.vehicle_number}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold uppercase"
              />
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Vehicle Type
              </label>
              <select
                value={newVehicle.vehicle_type}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold capitalize"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="truck">Truck</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={processing || checkInSlots.length === 0}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-md shadow-indigo-600/10 transition-all disabled:opacity-40"
              >
                {processing ? 'Processing check-in...' : 'Authorize Check-In'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
        {/* Search */}
        <div className="space-y-2">
          <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-550 uppercase">Search Vehicle Plate</label>
          <input
            type="text"
            placeholder="Search NY-777A..."
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-550 uppercase">Filter Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
          >
            <option value="all">All Bookings</option>
            <option value="active">Active Parked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-555 uppercase">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-105 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
          />
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-555 uppercase">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-105 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
          />
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSearchPlate('')
            setFilterStatus('all')
            setDateFrom('')
            setDateTo('')
          }}
          className="w-full py-2 bg-slate-100 border border-slate-205 dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-all"
        >
          Clear Filters
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden">
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-4 px-6">User Details</th>
                  <th className="py-4 px-6">Vehicle Details</th>
                  <th className="py-4 px-6">Parking Lot & Spot</th>
                  <th className="py-4 px-6">Entry / Exit</th>
                  <th className="py-4 px-6">Pricing Fee</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                {bookings.map((booking) => {
                  const isActive = booking.status === 'active'
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-850 dark:text-slate-200">{booking.profiles?.full_name || 'System User'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{booking.profiles?.phone || 'No phone'}</p>
                      </td>

                      <td className="py-4 px-6 uppercase font-bold text-indigo-650 dark:text-indigo-400">
                        <p>{booking.vehicles?.vehicle_number}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{booking.vehicles?.vehicle_type}</p>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-805 dark:text-slate-200">{booking.parking_slots?.parking_lots?.name}</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          Spot #{booking.parking_slots?.slot_number} ({booking.parking_slots?.slot_type})
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-slate-600 dark:text-slate-400"><span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase">In:</span> {new Date(booking.entry_time).toLocaleString()}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5"><span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase">Out:</span> {booking.exit_time ? new Date(booking.exit_time).toLocaleString() : 'Parked'}</p>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {booking.fee_amount ? `₹${parseFloat(booking.fee_amount).toFixed(2)}` : isActive ? 'Calculating' : '₹0.00'}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-1">
                          <span className={`w-fit text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            booking.status === 'active'
                              ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400'
                              : booking.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                          }`}>
                            {booking.status}
                          </span>
                          {isActive && booking.checkout_status === 'pending' && (
                            <span className="w-fit bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                              Checkout Pending
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isActive && (
                          <button
                            disabled={processing}
                            onClick={() => handleCheckout(booking.id)}
                            className={`disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-md ${
                              booking.checkout_status === 'pending'
                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 border border-amber-400/30 animate-pulse'
                                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                            }`}
                          >
                            {booking.checkout_status === 'pending' ? 'Approve Checkout' : 'Force Checkout'}
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
          <div className="text-center py-16 text-slate-450 dark:text-slate-500 font-semibold">
            No booking records match the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}
