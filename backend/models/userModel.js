const pool = require('../config/db')

const findByEmail = async (email) => {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    return rows[0]
}

const findById = async (id) => {
    const { rows } = await pool.query(
        "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = $1",
        [id]
    )
    return rows[0]
}

const createUser = async ({ first_name, last_name, email, passwordHash, role }) => {
    const { rows } = await pool.query(
        "INSERT INTO users(first_name, last_name, email, password_hash, role) VALUES($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, role, created_at",
        [first_name, last_name, email, passwordHash, role || 'patient']
    )
    return rows[0]
}

module.exports = {
    findByEmail,
    findById,
    createUser
}