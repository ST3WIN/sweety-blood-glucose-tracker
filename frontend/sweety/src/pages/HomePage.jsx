import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Droplet,
  LayoutDashboard,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { readingsApi } from '../services/readingsApi'

const SLOTS = [
  { id: 'morning_fasting', label: 'Morning (fasting)', article: 'a', timeHint: 'Before meal' },
  { id: 'after_breakfast', label: 'After breakfast', article: 'an', timeHint: '2h after breakfast' },
  { id: 'after_lunch', label: 'After lunch', article: 'an', timeHint: '2h after lunch' },
  { id: 'after_dinner', label: 'After dinner', article: 'an', timeHint: '2h after dinner' },
]

function getSlotConfig(slotId) {
  return SLOTS.find((s) => s.id === slotId) || { label: slotId, article: 'a' }
}

function getSlotErrorMessage(slotId) {
  const config = getSlotConfig(slotId)
  return `You already have ${config.article} ${config.label} reading for this date.`
}

// Format local date to YYYY-MM-DD
function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHumanDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Navigation
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'entries' | 'reports' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Current Date selection for Entries and Daily View
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [readings, setReadings] = useState([])
  const [loadingReadings, setLoadingReadings] = useState(false)

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [editingReading, setEditingReading] = useState(null)
  const [formData, setFormData] = useState({
    reading_date: getTodayString(),
    slot: 'morning_fasting',
    value: '',
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reports Data
  const [reportDate, setReportDate] = useState(getTodayString())
  const [reportData, setReportData] = useState(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportSubTab, setReportSubTab] = useState('daily') // 'daily' | 'monthToDate' | 'monthly'

  // User details
  const firstName = user?.first_name || 'User'
  const lastName = user?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const email = user?.email || ''
  const role = user?.role || 'patient'
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'

  // Load readings for selectedDate
  const fetchReadings = async (dateStr) => {
    setLoadingReadings(true)
    try {
      const data = await readingsApi.getByDate(dateStr)
      setReadings(data)
    } catch (err) {
      console.error('Failed to load readings:', err)
    } finally {
      setLoadingReadings(false)
    }
  }

  // Load reports for reportDate
  const fetchReports = async (dateStr) => {
    setLoadingReports(true)
    try {
      const data = await readingsApi.getReports(dateStr)
      setReportData(data)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    fetchReadings(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports(reportDate)
    }
  }, [reportDate, activeTab])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  // Date Navigation Helpers
  function handlePrevDay() {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d - 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setSelectedDate(`${year}-${month}-${day}`)
  }

  function handleNextDay() {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d + 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const nextDate = `${year}-${month}-${day}`
    if (nextDate <= getTodayString()) {
      setSelectedDate(nextDate)
    }
  }

  // Modal Open Handlers
  function openAddModal(defaultSlot = 'morning_fasting') {
    setModalMode('add')
    setEditingReading(null)
    setFormData({
      reading_date: selectedDate,
      slot: defaultSlot,
      value: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(reading) {
    setModalMode('edit')
    setEditingReading(reading)
    setFormData({
      reading_date: reading.reading_date,
      slot: reading.slot,
      value: String(reading.value),
    })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFormError('')
    setEditingReading(null)
  }

  // Form Validation & Submission
  async function handleSubmitReading(e) {
    e.preventDefault()
    setFormError('')

    const { reading_date, slot, value } = formData
    const today = getTodayString()

    // 1. Value is required: "Please enter a glucose value."
    if (value === undefined || value === null || String(value).trim() === '') {
      setFormError('Please enter a glucose value.')
      return
    }

    // 2. Value must be a whole number between 40 and 600: "Value must be between 40 and 600 mg/dl."
    const num = Number(value)
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      setFormError('Value must be between 40 and 600 mg/dl.')
      return
    }

    // 5. Date cannot be in the future: "Date cannot be in the future."
    if (!reading_date || reading_date > today) {
      setFormError('Date cannot be in the future.')
      return
    }

    // 4. Maximum 4 readings per day: "You can add only 4 readings per day."
    if (modalMode === 'add') {
      if (reading_date === selectedDate && readings.length >= 4) {
        setFormError('You can add only 4 readings per day.')
        return
      }
    }

    // 3. Only one reading per slot per day
    if (reading_date === selectedDate) {
      const slotExists = readings.some(
        (r) => r.slot === slot && (modalMode !== 'edit' || r.id !== editingReading?.id)
      )
      if (slotExists) {
        setFormError(getSlotErrorMessage(slot))
        return
      }
    }

    setSaving(true)
    try {
      if (modalMode === 'add') {
        await readingsApi.create({ reading_date, slot, value: num })
      } else {
        await readingsApi.update(editingReading.id, { reading_date, slot, value: num })
      }
      closeModal()
      fetchReadings(selectedDate)
      if (activeTab === 'reports') {
        fetchReports(reportDate)
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to save reading. Please try again.'
      setFormError(errMsg)
    } finally {
      setSaving(false)
    }
  }

  // Delete Action
  async function confirmDelete() {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await readingsApi.delete(deletingId)
      setDeletingId(null)
      fetchReadings(selectedDate)
      if (activeTab === 'reports') {
        fetchReports(reportDate)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper stats for today
  const dayStats = useMemo(() => {
    if (!readings || readings.length === 0) {
      return { count: 0, highest: null, lowest: null, average: null }
    }
    const vals = readings.map((r) => r.value)
    const highest = Math.max(...vals)
    const lowest = Math.min(...vals)
    const average = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
    return { count: vals.length, highest, lowest, average }
  }, [readings])

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'entries', label: 'Entries', icon: CalendarIcon },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex min-h-dvh bg-[#FAF9F6] text-ink antialiased">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-ink/10 bg-white p-5 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo & Mobile Close */}
          <div className="flex items-center justify-between pb-6 border-b border-ink/5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
                <Droplet size={18} strokeWidth={2.3} />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">Sweety</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-ink/50 hover:bg-ink/5 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-ink/65 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-teal-700' : 'text-ink/40'} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* User Details in Sidebar */}
        <div className="border-t border-ink/10 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-stone/70 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-xs">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{fullName}</p>
              <p className="truncate text-xs text-ink/55">{email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span className="text-[10px] font-medium tracking-wide uppercase text-teal-800">
                  {role}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 rounded-lg p-2 text-ink/40 transition hover:bg-white hover:text-red-600 shadow-2xs cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-white/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-ink/60 hover:bg-ink/5 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-medium text-ink/70 capitalize">
              {activeTab === 'overview'
                ? 'Overview'
                : activeTab === 'entries'
                ? 'Daily Readings'
                : activeTab === 'reports'
                ? 'Glucose Reports'
                : 'Settings'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openAddModal()}
              className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-800 shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              Add Reading
            </button>
          </div>
        </header>

        {/* Dynamic Views based on Active Tab */}
        <main className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                  Welcome, {firstName}.
                </h1>
                <p className="mt-1 text-sm text-ink/60">
                  {formatHumanDate(selectedDate)} — Summary of today's glucose records.
                </p>
              </div>

              {/* Stats Overview */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                    Readings
                  </span>
                  <p className="mt-2 font-display text-3xl font-medium text-ink">
                    {dayStats.count} <span className="text-sm text-ink/40 font-sans">/ 4</span>
                  </p>
                  <p className="mt-1 text-xs text-ink/50">Recorded for today</p>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                    Average
                  </span>
                  <p className="mt-2 font-display text-3xl font-medium text-ink">
                    {dayStats.average !== null ? `${dayStats.average}` : '—'}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">mg/dl</p>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                    Highest
                  </span>
                  <p className="mt-2 font-display text-3xl font-medium text-ink">
                    {dayStats.highest !== null ? `${dayStats.highest}` : '—'}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">Peak value</p>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                    Lowest
                  </span>
                  <p className="mt-2 font-display text-3xl font-medium text-ink">
                    {dayStats.lowest !== null ? `${dayStats.lowest}` : '—'}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">Minimum value</p>
                </div>
              </div>

              {/* Slot Cards List for Today */}
              <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-xl font-medium">Today's Schedule</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('entries')}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Manage full day →
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {SLOTS.map((slot) => {
                    const reading = readings.find((r) => r.slot === slot.id)
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition ${
                          reading
                            ? 'border-teal-200 bg-teal-50/40'
                            : 'border-ink/10 bg-stone/20 hover:border-ink/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                reading ? 'bg-teal-600' : 'bg-ink/20'
                              }`}
                            />
                            <p className="font-medium text-sm text-ink">{slot.label}</p>
                          </div>
                          <p className="text-xs text-ink/50 mt-0.5">{slot.timeHint}</p>
                        </div>

                        <div>
                          {reading ? (
                            <div className="text-right">
                              <span className="font-display text-2xl font-semibold text-teal-900">
                                {reading.value}
                              </span>
                              <span className="text-xs text-ink/50 ml-1">mg/dl</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAddModal(slot.id)}
                              className="rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs font-medium text-ink/75 hover:bg-ink/5 cursor-pointer"
                            >
                              + Log
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. ENTRIES TAB (ADD, VIEW, EDIT, DELETE) */}
          {activeTab === 'entries' && (
            <div className="space-y-6">
              {/* Date Navigation Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevDay}
                    className="rounded-lg p-2 text-ink/60 hover:bg-ink/5 cursor-pointer"
                    title="Previous day"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-center sm:text-left">
                    <p className="font-display text-lg font-medium">{formatHumanDate(selectedDate)}</p>
                    <p className="text-xs text-ink/50">
                      {selectedDate === getTodayString() ? 'Today' : 'Historical date'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextDay}
                    disabled={selectedDate >= getTodayString()}
                    className="rounded-lg p-2 text-ink/60 hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Next day"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    max={getTodayString()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink font-medium outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayString())}
                    className="rounded-xl bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/10 cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* 4 Time Slots List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-display text-xl font-medium">Daily Slots</h3>
                  <span className="text-xs text-ink/50">
                    {readings.length} of 4 slots logged
                  </span>
                </div>

                {loadingReadings ? (
                  <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/50">
                    Loading readings...
                  </div>
                ) : (
                  SLOTS.map((slot) => {
                    const reading = readings.find((r) => r.slot === slot.id)
                    return (
                      <div
                        key={slot.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                          reading
                            ? 'border-ink/10 bg-white shadow-2xs'
                            : 'border-dashed border-ink/15 bg-white/50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                              reading
                                ? 'bg-teal-700 text-white'
                                : 'bg-ink/5 text-ink/35'
                            }`}
                          >
                            <Droplet size={20} strokeWidth={2.2} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-lg font-medium text-ink">
                                {slot.label}
                              </h4>
                              {reading && (
                                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200">
                                  Logged
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink/55 mt-0.5">{slot.timeHint}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5">
                          {reading ? (
                            <>
                              <div className="text-right">
                                <span className="font-display text-3xl font-semibold text-ink">
                                  {reading.value}
                                </span>
                                <span className="text-xs text-ink/50 ml-1.5 font-medium">
                                  mg/dl
                                </span>
                              </div>

                              <div className="flex items-center gap-1 border-l border-ink/10 pl-4">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(reading)}
                                  className="rounded-lg p-2 text-ink/55 hover:bg-ink/5 hover:text-ink cursor-pointer"
                                  title="Edit reading"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(reading.id)}
                                  className="rounded-lg p-2 text-ink/55 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                  title="Delete reading"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAddModal(slot.id)}
                              className="flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition cursor-pointer"
                            >
                              <Plus size={14} />
                              Log reading
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Reports Header & Date Anchor Selector */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                <div>
                  <h3 className="font-display text-2xl font-semibold">Reports & Analysis</h3>
                  <p className="text-xs text-ink/60 mt-0.5">
                    View highest, lowest, and average glucose readings over standard ranges.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink/60 font-medium">Selected Date:</span>
                  <input
                    type="date"
                    max={getTodayString()}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink font-medium outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Sub-tabs for Report Range */}
              <div className="flex rounded-xl bg-ink/5 p-1 max-w-md">
                <button
                  type="button"
                  onClick={() => setReportSubTab('daily')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition cursor-pointer ${
                    reportSubTab === 'daily'
                      ? 'bg-white text-ink shadow-xs'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setReportSubTab('monthToDate')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition cursor-pointer ${
                    reportSubTab === 'monthToDate'
                      ? 'bg-white text-ink shadow-xs'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  Month-to-date
                </button>
                <button
                  type="button"
                  onClick={() => setReportSubTab('monthly')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition cursor-pointer ${
                    reportSubTab === 'monthly'
                      ? 'bg-white text-ink shadow-xs'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  Monthly (Prev Month)
                </button>
              </div>

              {loadingReports ? (
                <div className="rounded-2xl border border-ink/10 bg-white p-16 text-center text-sm text-ink/50">
                  Generating reports...
                </div>
              ) : reportData ? (
                (() => {
                  const currentReport =
                    reportSubTab === 'daily'
                      ? reportData.daily
                      : reportSubTab === 'monthToDate'
                      ? reportData.monthToDate
                      : reportData.monthly

                  const isEmpty = !currentReport || currentReport.count === 0

                  return (
                    <div className="space-y-6">
                      {/* Range Banner */}
                      <div className="flex items-center justify-between rounded-xl bg-teal-50 border border-teal-200/80 px-4 py-3 text-teal-900">
                        <div className="flex items-center gap-2">
                          <Activity size={18} className="text-teal-700" />
                          <span className="font-semibold text-sm">{currentReport.name} Report:</span>
                          <span className="text-xs font-medium text-teal-800">
                            {currentReport.dateRangeLabel}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-teal-700">
                          {currentReport.count} {currentReport.count === 1 ? 'reading' : 'readings'}
                        </span>
                      </div>

                      {/* Stats Cards or Friendly Empty State */}
                      {isEmpty ? (
                        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                            <Droplet size={22} />
                          </div>
                          <h4 className="mt-4 font-display text-xl font-medium text-ink">
                            No readings recorded
                          </h4>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-ink/60 leading-5">
                            There are no glucose readings logged for {currentReport.dateRangeLabel}. Record entries to see highest, lowest, and average statistics.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-4 sm:grid-cols-4">
                            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                                Highest Reading
                              </span>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-display text-3xl font-semibold text-ink">
                                  {currentReport.highest}
                                </span>
                                <span className="text-xs text-ink/50 font-medium">mg/dl</span>
                              </div>
                              <p className="mt-1 text-xs text-ink/45">Max value in range</p>
                            </div>

                            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                                Lowest Reading
                              </span>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-display text-3xl font-semibold text-ink">
                                  {currentReport.lowest}
                                </span>
                                <span className="text-xs text-ink/50 font-medium">mg/dl</span>
                              </div>
                              <p className="mt-1 text-xs text-ink/45">Min value in range</p>
                            </div>

                            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                                Average (1 dec)
                              </span>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-display text-3xl font-semibold text-teal-800">
                                  {currentReport.average}
                                </span>
                                <span className="text-xs text-ink/50 font-medium">mg/dl</span>
                              </div>
                              <p className="mt-1 text-xs text-ink/45">Rounded average</p>
                            </div>

                            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-2xs">
                              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">
                                Number of Readings
                              </span>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-display text-3xl font-semibold text-ink">
                                  {currentReport.count}
                                </span>
                                <span className="text-xs text-ink/50 font-medium">entries</span>
                              </div>
                              <p className="mt-1 text-xs text-ink/45">Total valid logs</p>
                            </div>
                          </div>

                          {/* Daily Report Extra: The daily report also lists each reading with its slot */}
                          {reportSubTab === 'daily' && currentReport.readings && (
                            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-2xs space-y-4">
                              <h4 className="font-display text-lg font-medium">
                                Readings for {currentReport.dateRangeLabel}
                              </h4>
                              <div className="divide-y divide-ink/5">
                                {currentReport.readings.map((r) => {
                                  const slotInfo = getSlotConfig(r.slot)
                                  return (
                                    <div
                                      key={r.id}
                                      className="flex items-center justify-between py-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-700">
                                          <Droplet size={16} />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-ink">
                                            {slotInfo.label}
                                          </p>
                                          <p className="text-xs text-ink/50">{slotInfo.timeHint}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-display text-xl font-semibold text-ink">
                                          {r.value}
                                        </span>
                                        <span className="text-xs text-ink/50 ml-1">mg/dl</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })()
              ) : null}
            </div>
          )}

          {/* 4. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-2xs space-y-5">
              <h3 className="font-display text-2xl font-semibold">User Details</h3>
              <p className="text-xs text-ink/60">
                Your authenticated profile stored in Supabase:
              </p>

              <dl className="divide-y divide-ink/5 text-sm">
                <div className="flex items-center justify-between py-3">
                  <dt className="text-ink/60">Full Name</dt>
                  <dd className="font-medium text-ink">{fullName}</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-ink/60">Email</dt>
                  <dd className="font-medium text-ink">{email}</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-ink/60">Role</dt>
                  <dd className="rounded-full bg-stone px-2.5 py-0.5 text-xs font-semibold uppercase text-teal-800">
                    {role}
                  </dd>
                </div>
              </dl>

              <div className="pt-4 border-t border-ink/5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  Sign out of account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADD / EDIT READING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-ink/10">
              <h3 className="font-display text-xl font-semibold">
                {modalMode === 'add' ? 'Add Glucose Reading' : 'Edit Glucose Reading'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReading} className="mt-5 space-y-4">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  max={getTodayString()}
                  required
                  value={formData.reading_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reading_date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </div>

              {/* Slot Selector */}
              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Time Slot
                </label>
                <select
                  value={formData.slot}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slot: e.target.value }))
                  }
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 cursor-pointer"
                >
                  {SLOTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.timeHint})
                    </option>
                  ))}
                </select>
              </div>

              {/* Glucose Value Input */}
              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Glucose Value (mg/dl)
                </label>
                <input
                  type="number"
                  step="1"
                  min="40"
                  max="600"
                  placeholder="e.g. 110"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
                <p className="mt-1 text-[11px] text-ink/50">
                  Must be a whole number between 40 and 600 mg/dl.
                </p>
              </div>

              {/* Validation Error Banner */}
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200"
                >
                  <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2.5 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-medium text-white hover:bg-teal-800 transition disabled:opacity-60 cursor-pointer"
                >
                  {saving
                    ? 'Saving...'
                    : modalMode === 'add'
                    ? 'Save Reading'
                    : 'Update Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-semibold text-ink">Delete Reading</h3>
            <p className="mt-2 text-xs text-ink/65 leading-relaxed">
              Are you sure you want to delete this reading? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
