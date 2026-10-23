const { asyncHandler } = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const usersService = require('../services/users.service');

// Controllers do three things only: read the validated input, call a service,
// send the response. No database access, no business rules.

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.valid.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.valid.body);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  // The auth middleware loaded the bare row to check isBlocked; this adds the
  // computed rating so /me matches the user returned by login.
  res.json(await usersService.getCurrentUser(req.user.id));
});

module.exports = { register, login, me };
