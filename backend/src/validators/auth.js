const Joi = require('joi');
const { ROLES } = require('../config/constants');

const registerSchema = Joi.object({
  // lowercase() normalizes the address so Anna@x.com and anna@x.com cannot
  // become two accounts.
  email: Joi.string().trim().lowercase().email().required(),
  // bcrypt only looks at the first 72 bytes, so a longer password would be
  // silently truncated - better to reject it.
  password: Joi.string().min(6).max(72).required(),
  name: Joi.string().trim().min(2).max(60).required(),
  // ADMIN is deliberately absent: an admin account can only come from the seed,
  // otherwise anyone could register as one.
  role: Joi.string().valid(ROLES.CLIENT, ROLES.FREELANCER).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  // No min() here: a wrong password should answer "invalid credentials", not
  // "too short", which would leak how passwords are stored.
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
