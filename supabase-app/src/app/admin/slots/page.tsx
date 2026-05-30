'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function SlotsGridPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [lots, setLots] = useState<any[]>([])
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [slots, setSlots] = useState<any[]>([])

  // Realtime connection status
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  // Modal / status change states
  const [activeSlot, setActiveSlot] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  async function loadLots() {
    try {
      const { data } = await supabase.from('parking_lots').select('*')
      if (data && data.length > 0) {
        setLots(data)
        setSelectedLotId(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching lots:', err)
    }
  }

  async function loadSlots(lotId: string) {
    if (!lotId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('lot_id', lotId)
        .order('slot_number', { ascending: true })

      if (data) {
        setSlots(data)
      }
    } catch (err) {
      console.error('Error loading slots:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLots()
  }, [])

  useEffect(() => {
    if (selectedLotId) {
      loadSlots(selectedLotId)
    }
  }, [selectedLotId])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!selectedLotId) return

    const channel = supabase.channel(`slots-grid-realtime-${selectedLotId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_slots',
          filter: `lot_id=eq.${selectedLotId}`,
        },
        (payload: any) => {
          const { eventType, new: newSlot } = payload

          setSlots((prevSlots) => {
            if (eventType === 'INSERT') {
              return [...prevSlots, newSlot].sort((a, b) => 
                parseInt(a.slot_number) - parseInt(b.slot_number)
              )
            }
            if (eventType === 'UPDATE') {
              return prevSlots.map((s) => s.id === newSlot.id ? newSlot : s)
            }
            return prevSlots
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
  }, [selectedLotId])

  const handleStatusChange = async (newStatus: string) => {
    if (!activeSlot) return
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('parking_slots')
        .update({ status: newStatus })
        .eq('id', activeSlot.id)

      if (error) {
        toast.error(`Failed to update slot: ${error.message}`)
      } else {
        toast.success(`Slot #${activeSlot.slot_number} marked as ${newStatus}`)
        setShowModal(false)
        setActiveSlot(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected update error occurred.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 border-emerald-250 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-500/50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 shadow-emerald-100/10'
      case 'occupied':
        return 'bg-rose-50 border-rose-250 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-500/50 dark:text-rose-400 dark:hover:bg-rose-950/40 shadow-rose-100/10'
      case 'reserved':
        return 'bg-amber-50 border-amber-250 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-500/50 dark:text-amber-400 dark:hover:bg-amber-950/40 shadow-amber-100/10'
      case 'maintenance':
        return 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-800/80'
      default:
        return 'bg-slate-100 border-slate-200 text-slate-500'
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Visual Slots Grid</h1>
            {/* Realtime Pulsing Dot Indicator */}
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border mt-1.5 ${
              realtimeConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-850 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ${realtimeConnected ? 'animate-ping' : ''}`}></span>
              <span>{realtimeConnected ? 'Realtime Connected' : 'Connecting'}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-505 dark:text-slate-400">
            Realtime lot configuration maps. Click any slot to alter status.
          </p>
        </div>

        {/* Lot Selector */}
        <div className="w-full sm:w-64">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Select Parking Lot
          </label>
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-xs font-semibold"
          >
            {lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.name} ({lot.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Color Guide */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-slate-200 dark:bg-slate-900/30 dark:border-slate-900 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
        <span className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400"></span>
          <span>Available</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-400"></span>
          <span>Occupied</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-400"></span>
          <span>Reserved</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-slate-400 border border-slate-350 dark:bg-slate-700 dark:border-slate-600"></span>
          <span>Maintenance</span>
        </span>
      </div>

      {loading ? (
        <div className="bg-slate-100/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-900/60 p-6 rounded-2xl animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-xl aspect-square"></div>
            ))}
          </div>
        </div>
      ) : slots.length > 0 ? (
        /* Grid Map */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 bg-white border border-slate-200 dark:bg-slate-900/10 dark:border-slate-900/60 p-6 rounded-2xl shadow-sm">
          {slots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => {
                setActiveSlot(slot)
                setShowModal(true)
              }}
              className={`p-4 rounded-xl border text-center cursor-pointer transition-all flex flex-col justify-between aspect-square ${getStatusStyles(
                slot.status
              )}`}
            >
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
                {slot.slot_type}
              </span>
              <span className="text-xl font-black mt-2 font-mono">
                {slot.slot_number}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider mt-2 opacity-80">
                {slot.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-8 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl text-slate-500 text-sm">
          No parking slots registered for this lot.
        </div>
      )}

      {/* Status Editor Modal */}
      {showModal && activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm dark:bg-slate-950/80">
          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 p-8 rounded-2xl max-w-sm w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowModal(false)
                setActiveSlot(null)
              }}
              className="absolute top-4 right-4 text-slate-405 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              ✕
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Manage Slot #{activeSlot.slot_number}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">
                Type: {activeSlot.slot_type} | Current: {activeSlot.status}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Change Status To:
              </label>

              {['available', 'occupied', 'reserved', 'maintenance'].map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updating || activeSlot.status === status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full py-2.5 px-4 rounded-xl border text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                    activeSlot.status === status
                      ? 'bg-slate-100 border-slate-200 dark:bg-slate-950 text-slate-400 dark:text-slate-650 dark:border-slate-900 cursor-not-allowed'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-950/50 dark:hover:bg-slate-950 dark:border-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-800'
                  }`}
                >
                  <span>{status} spot</span>
                  {activeSlot.status === status && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">Current</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
