const { asyncHandler } = require('../utils/asyncHandler');
const messagesService = require('../services/messages.service');

const list = asyncHandler(async (req, res) => {
  res.json(await messagesService.list(req.user, req.valid.params.id, req.valid.query));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await messagesService.create(req.user, req.valid.params.id, req.valid.body));
});

module.exports = { list, create };
