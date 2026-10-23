// Collects every feature router into the single one that app.js mounts at /api.
const { Router } = require('express');
const authRoutes = require('./auth.routes');
const categoriesRoutes = require('./categories.routes');
const ordersRoutes = require('./orders.routes');
const proposalsRoutes = require('./proposals.routes');
const freelancersRoutes = require('./freelancers.routes');
const dashboardRoutes = require('./dashboard.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/proposals', proposalsRoutes);
router.use('/freelancers', freelancersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
