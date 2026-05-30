'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function LotsCRUDPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [lots, setLots] = useState<any[]>([])

  // Form states
  const [editingLot, setEditingLot] = useState<any>(null) // Null for "Create Mode"
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    total_slots: 10,
    hourly_rate_car: 30.0,
    hourly_rate_bike: 20.0,
    hourly_rate_truck: 50.0,
  })

  // Action states
  const [saving, setSaving] = useState(false)

  async function loadLots() {
    setLoading(true)
    try {
      const { data } = await supabase.from('parking_lots').select('*')
      if (data) {
        setLots(data)
      }
    } catch (err) {
      console.error('Error fetching lots:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLots()
  }, [])

  const handleEditClick = (lot: any) => {
    setEditingLot(lot)
    setFormData({
      name: lot.name,
      location: lot.location,
      total_slots: lot.total_slots,
      hourly_rate_car: parseFloat(lot.hourly_rate_car),
      hourly_rate_bike: parseFloat(lot.hourly_rate_bike),
      hourly_rate_truck: parseFloat(lot.hourly_rate_truck),
    })
    setShowForm(true)
  }

  const handleCreateClick = () => {
    setEditingLot(null)
    setFormData({
      name: '',
      location: '',
      total_slots: 10,
      hourly_rate_car: 30.0,
      hourly_rate_bike: 20.0,
      hourly_rate_truck: 50.0,
    })
    setShowForm(true)
  }

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('Are you sure you want to delete this parking lot? This will permanently delete all slots, bookings, and payments.')) return
    setLoading(true)

    try {
      const { error: deleteErr } = await supabase
        .from('parking_lots')
        .delete()
        .eq('id', lotId)

      if (deleteErr) {
        toast.error(`Failed to delete lot: ${deleteErr.message}`)
      } else {
        toast.success('Parking lot and associated slots successfully deleted!')
        await loadLots()
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during deletion.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingLot) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('parking_lots')
          .update({
            name: formData.name,
            location: formData.location,
            total_slots: formData.total_slots,
            hourly_rate_car: formData.hourly_rate_car,
            hourly_rate_bike: formData.hourly_rate_bike,
            hourly_rate_truck: formData.hourly_rate_truck,
          })
          .eq('id', editingLot.id)

        if (updateErr) throw updateErr
        toast.success('Parking lot details updated successfully!')
      } else {
        // Create Mode
        const { data: newLot, error: insertErr } = await supabase
          .from('parking_lots')
          .insert({
            name: formData.name,
            location: formData.location,
            total_slots: formData.total_slots,
            hourly_rate_car: formData.hourly_rate_car,
            hourly_rate_bike: formData.hourly_rate_bike,
            hourly_rate_truck: formData.hourly_rate_truck,
          })
          .select()
          .single()

        if (insertErr || !newLot) throw insertErr

        // Proactively generate slot entries for the slots grid
        const slotsToInsert = []
        for (let i = 1; i <= formData.total_slots; i++) {
          slotsToInsert.push({
            lot_id: newLot.id,
            slot_number: `${i}`,
            slot_type: i % 10 === 0 ? 'EV' : i % 8 === 0 ? 'handicapped' : 'regular',
            status: 'available',
          })
        }

        const { error: slotsErr } = await supabase
          .from('parking_slots')
          .insert(slotsToInsert)

        if (slotsErr) {
          console.error('Generating slots generated error:', slotsErr)
        }
        toast.success('Parking lot created and slots generated successfully!')
      }

      setShowForm(false)
      await loadLots()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Manage Parking Lots</h1>
          <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">
            Create, update, or remove parking lots and customize pricing structures.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-xl shadow-md shadow-rose-600/10 transition-all self-start sm:self-center"
        >
          Add New Lot
        </button>
      </div>

      {/* CRUD Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-8 rounded-2xl shadow-sm dark:shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-805/60 pb-4">
            {editingLot ? `Edit Parking Lot: ${editingLot.name}` : 'Create New Parking Lot'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase">Lot Name</label>
              <input
                type="text"
                placeholder="E.g. Grand Terminal Parking"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold font-sans uppercase"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase">Location Address</label>
              <input
                type="text"
                placeholder="E.g. 5th Avenue, NYC"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
              />
            </div>

            {/* Total Slots */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Total Spots Target {editingLot && '(Read-Only)'}
              </label>
              <input
                type="number"
                disabled={editingLot !== null}
                required
                min={1}
                max={200}
                value={formData.total_slots}
                onChange={(e) => setFormData({ ...formData, total_slots: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
              />
            </div>

            {/* Hourly Rate Car */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase">Hourly Rate: Car (₹)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.hourly_rate_car}
                onChange={(e) => setFormData({ ...formData, hourly_rate_car: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-955 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
              />
            </div>

            {/* Hourly Rate Bike */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase">Hourly Rate: Bike (₹)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.hourly_rate_bike}
                onChange={(e) => setFormData({ ...formData, hourly_rate_bike: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-955 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
              />
            </div>

            {/* Hourly Rate Truck */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase">Hourly Rate: Truck (₹)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.hourly_rate_truck}
                onChange={(e) => setFormData({ ...formData, hourly_rate_truck: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-955 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-semibold"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-900/60">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all"
              >
                {saving ? 'Saving...' : 'Save Lot Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lots Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lots.length > 0 ? (
          lots.map((lot) => (
            <div key={lot.id} className="bg-white border border-slate-200 dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4 transition-colors duration-200">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200">{lot.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{lot.location}</p>
                </div>
                <span className="bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-slate-700 dark:text-slate-350 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {lot.total_slots} slots
                </span>
              </div>

              {/* Rates details */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-900 rounded-xl space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-900/50 pb-1.5 mb-1.5 uppercase text-[10px] tracking-wider">Hourly Pricing Rates</p>
                <div className="flex justify-between">
                  <span>Car hourly rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(lot.hourly_rate_car).toFixed(2)} / hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Bike hourly rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(lot.hourly_rate_bike).toFixed(2)} / hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Truck hourly rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(lot.hourly_rate_truck).toFixed(2)} / hr</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => handleEditClick(lot)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Edit Rates
                </button>
                <button
                  onClick={() => handleDeleteLot(lot.id)}
                  className="px-4 py-2 border border-rose-900/30 bg-rose-950/5 dark:bg-rose-955/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-950/20 dark:hover:bg-rose-950/30 hover:border-rose-800 transition-all"
                >
                  Delete Lot
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-16 p-8 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl text-slate-500 text-sm">
            No parking lots configured. Click "Add New Lot" to start!
          </div>
        )}
      </div>
    </div>
  )
}
