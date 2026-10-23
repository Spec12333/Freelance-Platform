const { asyncHandler } = require('../utils/asyncHandler');
const proposalsService = require('../services/proposals.service');

const listByOrder = asyncHandler(async (req, res) => {
  res.json(await proposalsService.listByOrder(req.user, req.valid.params.id));
});

const listMine = asyncHandler(async (req, res) => {
  res.json(await proposalsService.listMine(req.user, req.valid.query));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await proposalsService.create(req.user, req.valid.params.id, req.valid.body));
});

const accept = asyncHandler(async (req, res) => {
  res.json(await proposalsService.accept(req.user, req.valid.params.id));
});

module.exports = { listByOrder, listMine, create, accept };
