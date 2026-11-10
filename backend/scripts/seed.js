require('dotenv').config()
const bcrypt = require('bcrypt')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function seed() {
  console.log('--- Starting Database Seeding ---')

  const client = await pool.connect()
  try {
    // 1. Create or retrieve demo user
    const demoEmail = 'demo@sweety.com'
    const demoPassword = 'Password123!'
    const hashedPassword = await bcrypt.hash(demoPassword, 10)

    const userResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $4
       RETURNING id, first_name, last_name, email, role`,
      ['Demo', 'Patient', demoEmail, hashedPassword, 'patient']
    )

    const user = userResult.rows[0]
    console.log(`Demo user ready: ${user.email} (ID: ${user.id})`)
    console.log(`Credentials: Email: ${demoEmail} | Password: ${demoPassword}`)

    // 2. Generate sample readings
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-based
    const currentDay = today.getDate()

    const sampleEntries = []

    // A. Today's readings (leave after_dinner unlogged for testing)
    const todayStr = formatDate(today)
    sampleEntries.push({ date: todayStr, slot: 'morning_fasting', value: 95 })
    sampleEntries.push({ date: todayStr, slot: 'after_breakfast', value: 138 })
    sampleEntries.push({ date: todayStr, slot: 'after_lunch', value: 122 })

    // B. Month-to-date readings (previous days of this month)
    if (currentDay > 1) {
      const yesterday = new Date(currentYear, currentMonth, currentDay - 1)
      const yesterdayStr = formatDate(yesterday)
      sampleEntries.push({ date: yesterdayStr, slot: 'morning_fasting', value: 92 })
      sampleEntries.push({ date: yesterdayStr, slot: 'after_breakfast', value: 142 })
      sampleEntries.push({ date: yesterdayStr, slot: 'after_lunch', value: 118 })
      sampleEntries.push({ date: yesterdayStr, slot: 'after_dinner', value: 130 })
    }

    if (currentDay > 3) {
      const threeDaysAgo = new Date(currentYear, currentMonth, currentDay - 3)
      const threeDaysAgoStr = formatDate(threeDaysAgo)
      sampleEntries.push({ date: threeDaysAgoStr, slot: 'morning_fasting', value: 89 })
      sampleEntries.push({ date: threeDaysAgoStr, slot: 'after_lunch', value: 125 })
    }

    // First day of current month
    const firstOfCurrentMonth = new Date(currentYear, currentMonth, 1)
    const firstOfCurrentMonthStr = formatDate(firstOfCurrentMonth)
    sampleEntries.push({ date: firstOfCurrentMonthStr, slot: 'morning_fasting', value: 98 })
    sampleEntries.push({ date: firstOfCurrentMonthStr, slot: 'after_lunch', value: 132 })

    // C. Whole previous month readings (for Monthly report)
    const prevMonth = currentMonth - 1
    const prevMonthDays = [5, 12, 18, 25]
    prevMonthDays.forEach((d) => {
      const pDate = new Date(currentYear, prevMonth, d)
      const pDateStr = formatDate(pDate)
      sampleEntries.push({ date: pDateStr, slot: 'morning_fasting', value: 90 + (d % 15) })
      sampleEntries.push({ date: pDateStr, slot: 'after_breakfast', value: 130 + (d % 20) })
      sampleEntries.push({ date: pDateStr, slot: 'after_dinner', value: 120 + (d % 12) })
    })

    // Insert sample readings with ON CONFLICT DO UPDATE
    let insertedCount = 0
    for (const entry of sampleEntries) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, slot)
         DO UPDATE SET value = EXCLUDED.value`,
        [user.id, entry.date, entry.slot, entry.value]
      )
      insertedCount++
    }

    console.log(`Successfully seeded ${insertedCount} sample readings across today, month-to-date, and previous month.`)
    console.log('--- Database Seeding Complete ---')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
