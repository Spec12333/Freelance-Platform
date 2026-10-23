const { asyncHandler } = require('../utils/asyncHandler');
const ordersService = require('../services/orders.service');

const list = asyncHandler(async (req, res) => {
  res.json(await ordersService.list(req.valid.query));
});

const getById = asyncHandler(async (req, res) => {
  res.json(await ordersService.getById(req.valid.params.id));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await ordersService.create(req.user.id, req.valid.body));
});

const update = asyncHandler(async (req, res) => {
  res.json(await ordersService.update(req.user, req.valid.params.id, req.valid.body));
});

const changeStatus = asyncHandler(async (req, res) => {
  res.json(await ordersService.changeStatus(req.user, req.valid.params.id, req.valid.body.status));
});

module.exports = { list, getById, create, update, changeStatus };
