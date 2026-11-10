const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const controller = require('../controllers/readingController')

// All reading endpoints are protected
router.use(auth)

router.get('/reports', controller.getReports)
router.get('/', controller.getReadings)
router.post('/', controller.addReading)
router.put('/:id', controller.updateReading)
router.delete('/:id', controller.deleteReading)

module.exports = router
