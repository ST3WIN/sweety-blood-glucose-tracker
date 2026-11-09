require("dotenv").config()
const express = require('express');
const app = express()
const PORT = process.env.PORT || 5000
const pool = require('./config/db')


app.listen(PORT, () => console.log(`server running on port ${PORT}`))