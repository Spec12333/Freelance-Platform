const { Op } = require('sequelize');
const { User } = require('../models');
const { ROLES } = require('../config/constants');
const { getPagination, buildPage } = require('../utils/pagination');
const { publicUserAttributes, ratingAttribute } = require('./query.helpers');
const usersService = require('./users.service');
const reviewsService = require('./reviews.service');

const SORTS = {
  // Unrated freelancers go to the end instead of the top (Postgres puts NULLs
  // first in a DESC sort by default).
  rating: [[ratingAttribute('User')[0], 'DESC NULLS LAST'], ['id', 'ASC']],
  rate: [['hourlyRate', 'ASC NULLS LAST'], ['id', 'ASC']],
};

const list = async (query) => {
  const { search, skill, minRate, maxRate, sort } = query;
  const pagination = getPagination(query);

  // Blocked accounts disappear from the directory but keep their profile page.
  const where = { role: ROLES.FREELANCER, isBlocked: false };
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  // Postgres array containment: skills @> ARRAY['react']
  if (skill) where.skills = { [Op.contains]: [skill] };
  if (minRate !== undefined || maxRate !== undefined) {
    where.hourlyRate = {};
    if (minRate !== undefined) where.hourlyRate[Op.gte] = minRate;
    if (maxRate !== undefined) where.hourlyRate[Op.lte] = maxRate;
  }

  const result = await User.findAndCountAll({
    where,
    attributes: publicUserAttributes(),
    order: SORTS[sort],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return buildPage(result, pagination);
};

// GET /freelancers/:id - works for any user, so a client's profile (with the
// reviews freelancers left about them) can be shown the same way.
const getById = async (id) => {
  const user = await usersService.getPublicUser(id);
  const reviews = await reviewsService.latestForUser(id);
  return { ...user.toJSON(), reviews };
};

// Empty strings from a form mean "clear this field".
const emptyToNull = (data) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]));

const updateMe = async (user, data) => {
  await User.update(emptyToNull(data), { where: { id: user.id } });
  return usersService.getCurrentUser(user.id);
};

module.exports = { list, getById, updateMe };
