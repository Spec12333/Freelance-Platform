const { asyncHandler } = require('../utils/asyncHandler');
const freelancersService = require('../services/freelancers.service');

const list = asyncHandler(async (req, res) => {
  res.json(await freelancersService.list(req.valid.query));
});

const getById = asyncHandler(async (req, res) => {
  res.json(await freelancersService.getById(req.valid.params.id));
});

const updateMe = asyncHandler(async (req, res) => {
  res.json(await freelancersService.updateMe(req.user, req.valid.body));
});

module.exports = { list, getById, updateMe };
