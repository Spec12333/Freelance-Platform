const { asyncHandler } = require('../utils/asyncHandler');
const reviewsService = require('../services/reviews.service');

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await reviewsService.create(req.user, req.valid.params.id, req.valid.body));
});

const listByOrder = asyncHandler(async (req, res) => {
  res.json(await reviewsService.listByOrder(req.valid.params.id));
});

const listByUser = asyncHandler(async (req, res) => {
  res.json(await reviewsService.listByUser(req.valid.params.id, req.valid.query));
});

module.exports = { create, listByOrder, listByUser };
