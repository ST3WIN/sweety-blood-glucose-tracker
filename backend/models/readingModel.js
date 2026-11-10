const pool = require('../config/db')

// Use TO_CHAR to format reading_date as 'YYYY-MM-DD' so it avoids timezone conversions
const SELECT_FIELDS = `
  id,
  user_id,
  TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
  slot,
  value,
  created_at
`

const createReading = async ({ userId, readingDate, slot, value }) => {
  const { rows } = await pool.query(
    `INSERT INTO readings (user_id, reading_date, slot, value)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SELECT_FIELDS}`,
    [userId, readingDate, slot, value]
  )
  return rows[0]
}

const getReadingsByDate = async (userId, readingDate) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM readings
     WHERE user_id = $1 AND reading_date = $2
     ORDER BY 
       CASE slot
         WHEN 'morning_fasting' THEN 1
         WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3
         WHEN 'after_dinner' THEN 4
         ELSE 5
       END ASC`,
    [userId, readingDate]
  )
  return rows
}

const getReadingsByRange = async (userId, startDate, endDate) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
     ORDER BY reading_date ASC, 
       CASE slot
         WHEN 'morning_fasting' THEN 1
         WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3
         WHEN 'after_dinner' THEN 4
         ELSE 5
       END ASC`,
    [userId, startDate, endDate]
  )
  return rows
}

const getReadingById = async (id, userId) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM readings
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
  return rows[0]
}

const getReadingBySlotAndDate = async (userId, readingDate, slot, excludeId = null) => {
  let query = `
    SELECT ${SELECT_FIELDS}
    FROM readings
    WHERE user_id = $1 AND reading_date = $2 AND slot = $3
  `
  const params = [userId, readingDate, slot]

  if (excludeId) {
    query += ' AND id != $4'
    params.push(excludeId)
  }

  const { rows } = await pool.query(query, params)
  return rows[0]
}

const countReadingsByDate = async (userId, readingDate, excludeId = null) => {
  let query = `
    SELECT COUNT(*)::int AS count
    FROM readings
    WHERE user_id = $1 AND reading_date = $2
  `
  const params = [userId, readingDate]

  if (excludeId) {
    query += ' AND id != $3'
    params.push(excludeId)
  }

  const { rows } = await pool.query(query, params)
  return rows[0]?.count || 0
}

const updateReading = async ({ id, userId, readingDate, slot, value }) => {
  const { rows } = await pool.query(
    `UPDATE readings
     SET reading_date = $1, slot = $2, value = $3
     WHERE id = $4 AND user_id = $5
     RETURNING ${SELECT_FIELDS}`,
    [readingDate, slot, value, id, userId]
  )
  return rows[0]
}

const deleteReading = async (id, userId) => {
  const { rows } = await pool.query(
    `DELETE FROM readings
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  )
  return rows[0]
}

module.exports = {
  createReading,
  getReadingsByDate,
  getReadingsByRange,
  getReadingById,
  getReadingBySlotAndDate,
  countReadingsByDate,
  updateReading,
  deleteReading,
}
