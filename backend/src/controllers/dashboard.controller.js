const { asyncHandler } = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

// One endpoint, three payloads: the shape depends on the caller's role and is
// tagged with `role` so the frontend can tell them apart.
const get = asyncHandler(async (req, res) => {
  res.json(await dashboardService.get(req.user));
});

module.exports = { get };
