const pool = require('../config/db')

const findByEmail = async(email)=>{
    try{
        const {rows} = await pool.query("SELECT * FROM users WHERE email = $1",[email])
        return rows[0]
    }catch(error){
        console.error("Error finding user by email:", error)
    }
}

const findById = async(id)=>{
    try{
        const {rows} = await pool.query("SELECT id, first_name,last_name,email,role,created_at FROM users WHERE id = $1",[id])
        return rows[0]
    }catch(error){
        console.error("Error finding user by id:", error)
    }
}

const createUser = async({first_name,last_name,email,passwordHash,role})=>{
    try{
        const {rows} = await pool.query("INSERT INTO users(first_name,last_name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id, first_name,last_name,email,role,created_at",[first_name,last_name,email,passwordHash,role])
        return rows[0]
    }catch(error){
        console.error("Error creating user:", error)
    }
}

module.exports = {
    findByEmail,
    findById,
    createUser
}