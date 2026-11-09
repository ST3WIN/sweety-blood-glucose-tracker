const express = require('express')
const controller = require('../controllers/authController')
const auth = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/register', controller.registerUser)
router.post('/login', controller.login)
router.get('/me', auth, controller.getMe)

module.exports = router