// Collects every feature router into the single one that app.js mounts at /api.
const { Router } = require('express');
const authRoutes = require('./auth.routes');
const categoriesRoutes = require('./categories.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);

// Routers added in the next chunks: /orders, /proposals, /freelancers,
// /dashboard, /admin.

module.exports = router;
