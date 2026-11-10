const test = require('node:test')
const assert = require('node:assert/strict')

// Test Validation Logic
function validateReading({ value, reading_date, existingReadings = [], slot }) {
  const today = new Date().toLocaleDateString('en-CA')

  // 1. Value is required
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Please enter a glucose value.'
  }

  // 2. Value must be a whole number between 40 and 600
  const num = Number(value)
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    return 'Value must be between 40 and 600 mg/dl.'
  }

  // 3. Date cannot be in the future
  if (!reading_date || reading_date > today) {
    return 'Date cannot be in the future.'
  }

  // 4. Maximum 4 readings per day
  if (existingReadings.length >= 4) {
    return 'You can add only 4 readings per day.'
  }

  // 5. Only one reading per slot per day
  const slotLabels = {
    morning_fasting: 'a Morning (fasting)',
    after_breakfast: 'an After breakfast',
    after_lunch: 'an After lunch',
    after_dinner: 'an After dinner',
  }

  const duplicate = existingReadings.find((r) => r.slot === slot)
  if (duplicate) {
    return `You already have ${slotLabels[slot] || 'a'} reading for this date.`
  }

  return null // valid
}

function computeReportStats(values = []) {
  if (values.length === 0) {
    return { count: 0, highest: null, lowest: null, average: null }
  }
  const highest = Math.max(...values)
  const lowest = Math.min(...values)
  const average = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
  return { count: values.length, highest, lowest, average }
}

test('Validation: Value is required', () => {
  assert.equal(
    validateReading({ value: '', reading_date: '2026-10-15', slot: 'morning_fasting' }),
    'Please enter a glucose value.'
  )
})

test('Validation: Value must be a whole number between 40 and 600', () => {
  assert.equal(
    validateReading({ value: 39, reading_date: '2026-10-15', slot: 'morning_fasting' }),
    'Value must be between 40 and 600 mg/dl.'
  )
  assert.equal(
    validateReading({ value: 601, reading_date: '2026-10-15', slot: 'morning_fasting' }),
    'Value must be between 40 and 600 mg/dl.'
  )
  assert.equal(
    validateReading({ value: 120.5, reading_date: '2026-10-15', slot: 'morning_fasting' }),
    'Value must be between 40 and 600 mg/dl.'
  )
})

test('Validation: Date cannot be in the future', () => {
  assert.equal(
    validateReading({ value: 100, reading_date: '2099-01-01', slot: 'morning_fasting' }),
    'Date cannot be in the future.'
  )
})

test('Validation: Maximum 4 readings per day', () => {
  const fourReadings = [
    { slot: 'morning_fasting', value: 95 },
    { slot: 'after_breakfast', value: 130 },
    { slot: 'after_lunch', value: 120 },
    { slot: 'after_dinner', value: 115 },
  ]
  assert.equal(
    validateReading({
      value: 100,
      reading_date: '2026-10-15',
      slot: 'morning_fasting',
      existingReadings: fourReadings,
    }),
    'You can add only 4 readings per day.'
  )
})

test('Validation: Only one reading per slot per day', () => {
  const existing = [{ slot: 'after_lunch', value: 120 }]
  assert.equal(
    validateReading({
      value: 135,
      reading_date: '2026-10-15',
      slot: 'after_lunch',
      existingReadings: existing,
    }),
    'You already have an After lunch reading for this date.'
  )
})

test('Reports: computes Highest, Lowest, Average (1 decimal), and Count', () => {
  const stats = computeReportStats([95, 140, 115])
  assert.equal(stats.count, 3)
  assert.equal(stats.highest, 140)
  assert.equal(stats.lowest, 95)
  assert.equal(stats.average, 116.7) // (95 + 140 + 115) / 3 = 116.666... -> 116.7
})

test('Reports: returns empty state stats when no readings', () => {
  const stats = computeReportStats([])
  assert.deepEqual(stats, { count: 0, highest: null, lowest: null, average: null })
})
