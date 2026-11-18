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

const update = asyncHandler(async (req, res) => {
  res.json(await proposalsService.update(req.user, req.valid.params.id, req.valid.body));
});

const accept = asyncHandler(async (req, res) => {
  res.json(await proposalsService.accept(req.user, req.valid.params.id));
});

const remove = asyncHandler(async (req, res) => {
  await proposalsService.remove(req.user, req.valid.params.id);
  res.status(204).end();
});

module.exports = { listByOrder, listMine, create, update, remove, accept };
