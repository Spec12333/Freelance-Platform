const { asyncHandler } = require('../utils/asyncHandler');
const messagesService = require('../services/messages.service');
const { chatEvents } = require('../events/chat');

const list = asyncHandler(async (req, res) => {
  res.json(await messagesService.list(req.user, req.valid.params.id, req.valid.query));
});

const create = asyncHandler(async (req, res) => {
  const message = await messagesService.create(req.user, req.valid.params.id, req.valid.body);
  // Publish only the saved message; failed validation never reaches the chat.
  chatEvents.emit('message:created', message);
  res.status(201).json(message);
});

module.exports = { list, create };
