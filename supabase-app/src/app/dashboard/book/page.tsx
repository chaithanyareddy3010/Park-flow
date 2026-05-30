'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function BookParkingPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [lots, setLots] = useState<any[]>([])
  const [savedVehicles, setSavedVehicles] = useState<any[]>([])

  // Realtime connection status
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  // Selection states
  const [selectedLot, setSelectedLot] = useState<any>(null)
  const [selectedSlotType, setSelectedSlotType] = useState<string>('')
  const [useSavedVehicle, setUseSavedVehicle] = useState<boolean>(true)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')

  // New vehicle form states
  const [newVehicle, setNewVehicle] = useState({
    owner_name: '',
    vehicle_number: '',
    vehicle_type: 'car',
    phone: '',
  })

  // Booking process states
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false)

  async function loadInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // 1. Fetch parking lots with their slots
      const { data: lotsData } = await supabase
        .from('parking_lots')
        .select('*, parking_slots (id, status, slot_type, lot_id)')

      if (lotsData) {
        setLots(lotsData)
      }

      // 2. Fetch saved vehicles for this user
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)

      if (vehiclesData) {
        setSavedVehicles(vehiclesData)
        if (vehiclesData.length > 0) {
          setSelectedVehicleId(vehiclesData[0].id)
        } else {
          setUseSavedVehicle(false)
        }
      } else {
        setUseSavedVehicle(false)
      }
    } catch (err) {
      console.error('Error loading booking data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Hook up Supabase Realtime to update slot availability live
  useEffect(() => {
    const channel = supabase.channel('user-booking-slots-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        (payload: any) => {
          const { eventType, new: newSlot } = payload

          setLots((prevLots) => {
            return prevLots.map((lot) => {
              if (lot.id === newSlot.lot_id) {
                let updatedSlots = [...(lot.parking_slots || [])]
                const index = updatedSlots.findIndex((s) => s.id === newSlot.id)

                if (index !== -1) {
                  if (eventType === 'UPDATE') {
                    updatedSlots[index] = newSlot
                  }
                } else if (eventType === 'INSERT') {
                  updatedSlots.push(newSlot)
                }

                if (selectedLot && selectedLot.id === lot.id) {
                  setSelectedLot((prevSelected: any) => ({
                    ...prevSelected,
                    parking_slots: updatedSlots,
                  }))
                }

                return { ...lot, parking_slots: updatedSlots }
              }
              return lot
            })
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true)
        } else {
          setRealtimeConnected(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedLot])

  // Calculate available slot counts for each lot dynamically
  const getSlotStats = (lot: any) => {
    const slots = lot.parking_slots || []
    const total = slots.length
    const available = slots.filter((s: any) => s.status === 'available').length
    const regularAvail = slots.filter((s: any) => s.slot_type === 'regular' && s.status === 'available').length
    const handicappedAvail = slots.filter((s: any) => s.slot_type === 'handicapped' && s.status === 'available').length
    const evAvail = slots.filter((s: any) => s.slot_type === 'EV' && s.status === 'available').length

    return { total, available, regularAvail, handicappedAvail, evAvail }
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot || !selectedSlotType) {
      toast.error('Please select a parking lot and slot type.')
      return
    }

    setBookingInProgress(true)

    try {
      // 1. Check if user already has an active booking
      const { data: activeCheck } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (activeCheck) {
        toast.error('You already have an active parking booking. Check out first before booking a new spot.')
        setBookingInProgress(false)
        return
      }

      let vehicleId = selectedVehicleId

      // 2. Insert new vehicle if user is not using a saved one
      if (!useSavedVehicle) {
        const { owner_name, vehicle_number, vehicle_type, phone } = newVehicle
        if (!owner_name || !vehicle_number) {
          toast.error('Please enter the owner name and vehicle plate number.')
          setBookingInProgress(false)
          return
        }

        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('vehicle_number', vehicle_number.toUpperCase())
          .maybeSingle()

        if (existingVehicle) {
          vehicleId = existingVehicle.id
        } else {
          const { data: insertedVehicle, error: insertErr } = await supabase
            .from('vehicles')
            .insert({
              user_id: user.id,
              owner_name,
              vehicle_number: vehicle_number.toUpperCase(),
              vehicle_type,
              phone: phone || null,
            })
            .select()
            .single()

          if (insertErr || !insertedVehicle) {
            toast.error(`Failed to register vehicle: ${insertErr?.message}`)
            setBookingInProgress(false)
            return
          }
          vehicleId = insertedVehicle.id
        }
      }

      // 3. Find an available slot of the selected type in the chosen lot
      const { data: slot, error: slotErr } = await supabase
        .from('parking_slots')
        .select('id')
        .eq('lot_id', selectedLot.id)
        .eq('slot_type', selectedSlotType)
        .eq('status', 'available')
        .limit(1)
        .maybeSingle()

      if (slotErr || !slot) {
        toast.error(`No available ${selectedSlotType} spots remaining in this parking lot.`)
        setBookingInProgress(false)
        return
      }

      // 4. Create the booking entry
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          slot_id: slot.id,
          vehicle_id: vehicleId,
          user_id: user.id,
          entry_time: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single()

      if (bookingErr || !booking) {
        toast.error(`Failed to finalize booking: ${bookingErr?.message}`)
        setBookingInProgress(false)
        return
      }

      // 5. Update slot status to occupied
      await supabase
        .from('parking_slots')
        .update({ status: 'occupied' })
        .eq('id', slot.id)

      toast.success('Parking booking confirmed successfully!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || 'An unexpected booking error occurred.')
    } finally {
      setBookingInProgress(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Book Parking Spot</h1>
            {/* Realtime Pulsing Dot Indicator */}
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border mt-1.5 ${
              realtimeConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-850 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ${realtimeConnected ? 'animate-ping' : ''}`}></span>
              <span>{realtimeConnected ? 'Live Spot Counts Active' : 'Connecting'}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Find lots, configure your vehicle, and claim your parking slot.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Select Lot (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
              <span>Select Parking Lot</span>
            </h2>

            <div className="space-y-4">
              {lots.map((lot) => {
                const stats = getSlotStats(lot)
                const isSelected = selectedLot?.id === lot.id
                return (
                  <div
                    key={lot.id}
                    onClick={() => {
                      setSelectedLot(lot)
                      setSelectedSlotType('')
                    }}
                    className={`p-5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/20 dark:bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-950/30'
                        : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-slate-805 dark:text-slate-200 text-lg">{lot.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{lot.location}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          stats.available > 0 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {stats.available} / {stats.total} spots free
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-900/60 text-xs text-slate-500 dark:text-slate-400">
                      <div>Car: <span className="font-semibold text-slate-800 dark:text-slate-200">₹{parseFloat(lot.hourly_rate_car).toFixed(2)}/hr</span></div>
                      <div>Bike: <span className="font-semibold text-slate-800 dark:text-slate-200">₹{parseFloat(lot.hourly_rate_bike).toFixed(2)}/hr</span></div>
                      <div>Truck: <span className="font-semibold text-slate-800 dark:text-slate-200">₹{parseFloat(lot.hourly_rate_truck).toFixed(2)}/hr</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Configure Slot Type & Vehicle details */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
              <span>Slot & Vehicle Details</span>
            </h2>

            {selectedLot ? (
              <form onSubmit={handleConfirmBooking} className="space-y-6">
                {/* Pick Slot Type */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Select Slot Type
                  </label>
                  {(() => {
                    const stats = getSlotStats(selectedLot)
                    return (
                      <div className="grid grid-cols-1 gap-2">
                        {['regular', 'handicapped', 'EV'].map((type) => {
                          const availCount =
                            type === 'regular'
                              ? stats.regularAvail
                              : type === 'handicapped'
                              ? stats.handicappedAvail
                              : stats.evAvail

                          const isAvailable = availCount > 0
                          const isSelected = selectedSlotType === type

                          return (
                            <button
                              key={type}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setSelectedSlotType(type)}
                              className={`w-full p-3.5 rounded-xl border text-left flex justify-between items-center text-sm font-semibold transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                                  : isAvailable
                                  ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-800'
                                  : 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              <span className="capitalize">{type} Spot</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                                {isAvailable ? `${availCount} spots left` : 'Fully Occupied'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Choose Vehicle */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Select Vehicle
                    </label>
                    {savedVehicles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseSavedVehicle(!useSavedVehicle)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider"
                      >
                        {useSavedVehicle ? 'Add New' : 'Use Saved'}
                      </button>
                    )}
                  </div>

                  {useSavedVehicle && savedVehicles.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-900 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium"
                      >
                        {savedVehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicle_number} ({vehicle.owner_name} - {vehicle.vehicle_type})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-200 dark:border-slate-900 rounded-xl">
                      <div>
                        <input
                          type="text"
                          placeholder="Owner Name"
                          required
                          value={newVehicle.owner_name}
                          onChange={(e) => setNewVehicle({ ...newVehicle, owner_name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Plate Number (e.g. TX-991A)"
                          required
                          value={newVehicle.vehicle_number}
                          onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none text-xs uppercase"
                        />
                      </div>
                      <div>
                        <select
                          value={newVehicle.vehicle_type}
                          onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none text-xs capitalize"
                        >
                          <option value="car">Car</option>
                          <option value="bike">Bike</option>
                          <option value="truck">Truck</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Owner Phone (Optional)"
                          value={newVehicle.phone}
                          onChange={(e) => setNewVehicle({ ...newVehicle, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={bookingInProgress || !selectedSlotType}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/10 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {bookingInProgress ? (
                    <span className="flex items-center space-x-2 animate-pulse">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Processing Spot...</span>
                    </span>
                  ) : (
                    'Confirm & Book Spot'
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8 text-slate-450 dark:text-slate-500 text-sm font-medium">
                Select a parking lot from the left list first.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
