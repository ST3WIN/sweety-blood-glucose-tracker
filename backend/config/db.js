require("dotenv").config()
const {Pool} = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false,
    },
    max:10,
    idleTimeoutMillis:30000,
    connectionTimeoutMillis:10000,
})

pool.on("error",(err)=>{
    console.error("Unexpected PostgreSQL pool error:",err)
})
pool.query('SELECT now()')
    .then((res) => console.log("PostgreSQL connected at", res.rows[0].now))
    .catch((err) => {
        console.error("PostgreSQL connection failed:", err.message)
        process.exit(1)
    })

module.exports =  pool ;