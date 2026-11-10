const Reading = require('../models/readingModel')
const { HTTP_STATUS } = require('../constants/httpStatus')

const VALID_SLOTS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
]

const SLOT_CONFIG = {
  morning_fasting: {
    label: 'Morning (fasting)',
    article: 'a',
  },
  after_breakfast: {
    label: 'After breakfast',
    article: 'an',
  },
  after_lunch: {
    label: 'After lunch',
    article: 'an',
  },
  after_dinner: {
    label: 'After dinner',
    article: 'an',
  },
}

function getSlotErrorMessage(slot) {
  const config = SLOT_CONFIG[slot]
  if (!config) return 'You already have a reading for this slot on this date.'
  return `You already have ${config.article} ${config.label} reading for this date.`
}

// Validate date is not in future
function isFutureDate(dateStr) {
  if (!dateStr) return false
  // Compare YYYY-MM-DD against today in local time and UTC to be fair across timezones
  const todayLocal = new Date().toLocaleDateString('en-CA') // outputs YYYY-MM-DD
  const todayUTC = new Date().toISOString().split('T')[0]
  const latestToday = todayLocal > todayUTC ? todayLocal : todayUTC
  return dateStr > latestToday
}

function computeStats(readings = []) {
  if (!readings || readings.length === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null,
    }
  }

  const values = readings.map((r) => r.value)
  const highest = Math.max(...values)
  const lowest = Math.min(...values)
  const sum = values.reduce((acc, curr) => acc + curr, 0)
  const average = Number((sum / values.length).toFixed(1))

  return {
    count: values.length,
    highest,
    lowest,
    average,
  }
}

// Helper to format Date to YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to format human-readable date e.g. "15 Oct 2026"
function formatHumanDate(d) {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// POST /api/readings
const addReading = async (req, res) => {
  try {
    const userId = req.userId
    const { reading_date, slot, value } = req.body

    // 1. Value is required
    if (value === undefined || value === null || String(value).trim() === '') {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Please enter a glucose value.' })
    }

    // 2. Value must be a whole number between 40 and 600
    const numValue = Number(value)
    if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Value must be between 40 and 600 mg/dl.' })
    }

    // 3. Date is required and cannot be in future
    if (!reading_date) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Please select a date.' })
    }

    if (isFutureDate(reading_date)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Date cannot be in the future.' })
    }

    // Check slot valid
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Please select a valid time slot.' })
    }

    // 4. Maximum 4 readings per day
    const count = await Reading.countReadingsByDate(userId, reading_date)
    if (count >= 4) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'You can add only 4 readings per day.' })
    }

    // 5. Only one reading per slot per day
    const existingSlotReading = await Reading.getReadingBySlotAndDate(
      userId,
      reading_date,
      slot
    )
    if (existingSlotReading) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: getSlotErrorMessage(slot) })
    }

    const reading = await Reading.createReading({
      userId,
      readingDate: reading_date,
      slot,
      value: numValue,
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Reading added successfully',
      reading,
    })
  } catch (error) {
    console.error('Error adding reading:', error)
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal server error while adding reading' })
  }
}

// GET /api/readings
const getReadings = async (req, res) => {
  try {
    const userId = req.userId
    const { date, startDate, endDate } = req.query

    let readings = []
    if (date) {
      readings = await Reading.getReadingsByDate(userId, date)
    } else if (startDate && endDate) {
      readings = await Reading.getReadingsByRange(userId, startDate, endDate)
    } else {
      // Default to today's date if nothing passed
      const today = new Date().toLocaleDateString('en-CA')
      readings = await Reading.getReadingsByDate(userId, today)
    }

    return res.status(HTTP_STATUS.OK).json({ readings })
  } catch (error) {
    console.error('Error fetching readings:', error)
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal server error while fetching readings' })
  }
}

// PUT /api/readings/:id
const updateReading = async (req, res) => {
  try {
    const userId = req.userId
    const { id } = req.params
    const { reading_date, slot, value } = req.body

    const existing = await Reading.getReadingById(id, userId)
    if (!existing) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: 'Reading not found' })
    }

    // 1. Value is required
    if (value === undefined || value === null || String(value).trim() === '') {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Please enter a glucose value.' })
    }

    // 2. Value must be a whole number between 40 and 600
    const numValue = Number(value)
    if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Value must be between 40 and 600 mg/dl.' })
    }

    // 3. Date cannot be in the future
    const targetDate = reading_date || existing.reading_date
    if (isFutureDate(targetDate)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Date cannot be in the future.' })
    }

    const targetSlot = slot || existing.slot
    if (!VALID_SLOTS.includes(targetSlot)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Please select a valid time slot.' })
    }

    // Check conflict with other readings on that date/slot
    const conflict = await Reading.getReadingBySlotAndDate(
      userId,
      targetDate,
      targetSlot,
      id
    )
    if (conflict) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: getSlotErrorMessage(targetSlot) })
    }

    const updated = await Reading.updateReading({
      id,
      userId,
      readingDate: targetDate,
      slot: targetSlot,
      value: numValue,
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Reading updated successfully',
      reading: updated,
    })
  } catch (error) {
    console.error('Error updating reading:', error)
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal server error while updating reading' })
  }
}

// DELETE /api/readings/:id
const deleteReading = async (req, res) => {
  try {
    const userId = req.userId
    const { id } = req.params

    const deleted = await Reading.deleteReading(id, userId)
    if (!deleted) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: 'Reading not found' })
    }

    return res
      .status(HTTP_STATUS.OK)
      .json({ message: 'Reading deleted successfully', id: deleted.id })
  } catch (error) {
    console.error('Error deleting reading:', error)
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal server error while deleting reading' })
  }
}

// GET /api/readings/reports
// Generates Daily, Month-to-date, and Monthly (whole previous month) reports based on selectedDate
const getReports = async (req, res) => {
  try {
    const userId = req.userId
    const { selectedDate } = req.query

    // Target date parse
    const anchorDateStr = selectedDate || new Date().toLocaleDateString('en-CA')
    const [yearStr, monthStr, dayStr] = anchorDateStr.split('-')
    const year = parseInt(yearStr, 10)
    const monthIndex = parseInt(monthStr, 10) - 1 // 0-based
    const day = parseInt(dayStr, 10)

    const anchorDate = new Date(year, monthIndex, day)

    // 1. Daily: The selected date (also lists each reading with its slot)
    const dailyReadings = await Reading.getReadingsByDate(userId, anchorDateStr)
    const dailyStats = computeStats(dailyReadings)

    const dailyReport = {
      name: 'Daily',
      dateRangeLabel: formatHumanDate(anchorDate),
      startDate: anchorDateStr,
      endDate: anchorDateStr,
      ...dailyStats,
      readings: dailyReadings, // List each reading with its slot
    }

    // 2. Month-to-date: 1st of the month to the selected date
    const mtdStart = new Date(year, monthIndex, 1)
    const mtdStartStr = formatDate(mtdStart)
    const mtdReadings = await Reading.getReadingsByRange(
      userId,
      mtdStartStr,
      anchorDateStr
    )
    const mtdStats = computeStats(mtdReadings)

    const mtdReport = {
      name: 'Month-to-date',
      dateRangeLabel: `${formatHumanDate(mtdStart)} – ${formatHumanDate(anchorDate)}`,
      startDate: mtdStartStr,
      endDate: anchorDateStr,
      ...mtdStats,
    }

    // 3. Monthly: The whole previous month
    // E.g., if anchor is in Oct 2026, whole previous month is 1 Sep 2026 – 30 Sep 2026
    const prevMonthStart = new Date(year, monthIndex - 1, 1)
    const prevMonthEnd = new Date(year, monthIndex, 0) // Day 0 of current month = last day of prev month
    const prevMonthStartStr = formatDate(prevMonthStart)
    const prevMonthEndStr = formatDate(prevMonthEnd)

    const prevMonthReadings = await Reading.getReadingsByRange(
      userId,
      prevMonthStartStr,
      prevMonthEndStr
    )
    const monthlyStats = computeStats(prevMonthReadings)

    const monthlyReport = {
      name: 'Monthly',
      dateRangeLabel: `${formatHumanDate(prevMonthStart)} – ${formatHumanDate(prevMonthEnd)}`,
      startDate: prevMonthStartStr,
      endDate: prevMonthEndStr,
      ...monthlyStats,
    }

    return res.status(HTTP_STATUS.OK).json({
      selectedDate: anchorDateStr,
      daily: dailyReport,
      monthToDate: mtdReport,
      monthly: monthlyReport,
    })
  } catch (error) {
    console.error('Error generating reports:', error)
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal server error while generating reports' })
  }
}

module.exports = {
  addReading,
  getReadings,
  updateReading,
  deleteReading,
  getReports,
}
