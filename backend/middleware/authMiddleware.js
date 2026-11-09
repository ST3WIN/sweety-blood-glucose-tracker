const jwt = require('jsonwebtoken')
const {HTTP_STATUS} = require('../constants/httpStatus')

const auth = async (req, res, next) => {
    const token = req.cookies.token
    if (!token) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Please log in.' })

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = payload.id
        next()
    } catch {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Session expired. Please log in again.' })
    }
}

module.exports = auth