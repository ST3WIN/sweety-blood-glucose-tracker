require("dotenv").config()
const express = require('express');
const cors = require('cors');
const app = express()
const PORT = process.env.PORT || 5000
const pool = require('./config/db');
const morgan = require("morgan");
const cookieParser = require('cookie-parser')
const authroutes = require('./routes/authRoutes')
const readingRoutes = require('./routes/readingRoutes')

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

if(process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
}



app.get("/api/health",(req,res)=>{res.json({success:true,message:"API is running"})})
app.use("/api/auth",authroutes)
app.use("/api/readings",readingRoutes)
    
app.listen(PORT, () => console.log(`server running on port ${PORT}`))
