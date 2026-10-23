const { Router } = require('express');
const { auth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = Router();

router.get('/', auth, dashboardController.get);

module.exports = router;
