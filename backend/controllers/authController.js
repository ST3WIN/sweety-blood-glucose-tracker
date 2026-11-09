const bycrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const {HTTP_STATUS} = require('../constants/httpStatus')
const {AUTH_MESSAGES, COMMON_MESSAGES} = require('../constants/messages')

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
}

const signToken = (userId) => jwt.sign({id:userId},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'})

const registerUser = async(req,res)=>{
    try{
        const {firstName,lastName,email,password,role} = req.body
        if(!firstName || !lastName || !email || !password){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({message:AUTH_MESSAGES.PROVIDE_CREDENTIALS})
        }

        const exists = await User.findByEmail(email.trim().toLowerCase())

        if(exists){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({message:AUTH_MESSAGES.EMAIL_EXISTS})
        }

        const passwordHash = await bycrypt.hash(password,10)
        const user = await User.createUser({
            first_name:firstName.trim(),
            last_name:lastName.trim(),
            email:email.trim().toLowerCase(),
            passwordHash:passwordHash,
            role:role 
        })
        res.cookie("token",signToken(user.id),cookieOptions)
        res.status(HTTP_STATUS.CREATED).json({message:AUTH_MESSAGES.REGISTRATION_SUCCESS, user})
    }catch(error){
        console.error("Error registering user:", error)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({message:COMMON_MESSAGES.INTERNAL_SERVER_ERROR})
    }
}

const login = async(req,res)=>{
    try{
        const {email,password} = req.body
        if(!email || !password){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({message:AUTH_MESSAGES.PROVIDE_CREDENTIALS})
        }
        const user = await User.findByEmail(email.trim().toLowerCase())
        if(!user || !await bycrypt.compare(password,user.password_hash)){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({message:AUTH_MESSAGES.INVALID_CREDENTIALS})
        }
        res.cookie("token",signToken(user.id),cookieOptions)
        res.status(HTTP_STATUS.OK).json({message:AUTH_MESSAGES.LOGIN_SUCCESS, user:{
            id:user.id,
            first_name:user.first_name,
            last_name:user.last_name,
            email:user.email,
            role:user.role
        }})
    }catch(error){
        console.error("Error logging in user:", error)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({message:COMMON_MESSAGES.INTERNAL_SERVER_ERROR})
    }
}

const getMe = async(req,res)=>{
    try{
        const user = await User.findById(req.userId)
        if(!user){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({message:AUTH_MESSAGES.NOT_AUTHORIZED})
        }
        res.status(HTTP_STATUS.OK).json({user})
    }catch(error){
        console.error("Error fetching user:", error)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({message:COMMON_MESSAGES.INTERNAL_SERVER_ERROR})
    }
}

module.exports = {
    registerUser,
    login,
    getMe
}