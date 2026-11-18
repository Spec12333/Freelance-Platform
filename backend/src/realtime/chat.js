const { Server } = require('socket.io');
const Joi = require('joi');
const { env } = require('../config/env');
const { isAllowedOrigin } = require('../config/origins');
const { Order, User } = require('../models');
const { ApiError } = require('../utils/ApiError');
const { authenticateToken } = require('../services/session.service');
const { loadOrderForChat } = require('../services/messages.service');
const { participantRole } = require('../services/orders.service');
const { chatEvents } = require('../events/chat');

const handshakeSchema = Joi.object({
  token: Joi.string().required(),
  orderId: Joi.number().integer().positive().max(Number.MAX_SAFE_INTEGER).strict().required(),
});

const errorBody = (error) => ({
  status: error instanceof ApiError ? error.status : 500,
  message: error instanceof ApiError ? error.message : 'Live chat is unavailable, please try again',
});

const closeSocket = (socket, error) => {
  socket.emit('chat:error', errorBody(error));
  socket.disconnect(true);
};

// One connection belongs to one authenticated user and one project.
const attachChat = (server) => {
  const io = new Server(server, {
    transports: ['websocket'],
    cors: { origin: env.clientUrls },
    // Browser WebSocket upgrades also need an origin check, beyond HTTP CORS.
    allowRequest: (req, callback) => callback(null, isAllowedOrigin(req.headers.origin, req.headers.host)),
  });

  io.use(async (socket, next) => {
    try {
      const { value, error } = handshakeSchema.validate(socket.handshake.auth);
      if (error) throw ApiError.badRequest('A token and a valid orderId are required');
      const { user, expiresAt } = await authenticateToken(value.token);
      const order = await loadOrderForChat(user, value.orderId);
      if (!order.freelancerId) throw ApiError.conflict('The chat opens once a freelancer is assigned to the order');
      socket.data = { userId: user.id, orderId: order.id, expiresAt };
      next();
    } catch (error) {
      const body = errorBody(error);
      const connectionError = new Error(body.message);
      connectionError.data = body;
      if (body.status === 500) console.error('Chat connection failed:', error);
      next(connectionError);
    }
  });

  io.on('connection', async (socket) => {
    let expiryTimer;
    // Existing connections must stop receiving messages when their JWT expires.
    const checkExpiry = () => {
      if (!socket.connected || !socket.data.expiresAt) return;
      const remaining = socket.data.expiresAt - Date.now();
      if (remaining <= 0) return closeSocket(socket, ApiError.unauthorized('Invalid or expired token'));
      expiryTimer = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
      expiryTimer.unref();
    };
    socket.on('disconnect', () => clearTimeout(expiryTimer));
    await socket.join([`order:${socket.data.orderId}`, `user:${socket.data.userId}`]);
    if (!socket.connected) return;
    checkExpiry();
    if (socket.connected) socket.emit('chat:ready');
  });

  const publishMessage = async (message) => {
    try {
      const sockets = await io.in(`order:${message.orderId}`).fetchSockets();
      if (sockets.length === 0) return;
      // Recheck current accounts and participants before delivering private data.
      // This also covers a block that raced with a connection handshake.
      const order = await Order.findByPk(message.orderId);
      if (!order) {
        for (const socket of sockets) closeSocket(socket, ApiError.notFound('Order not found'));
        return;
      }
      const users = await User.findAll({
        where: { id: [...new Set(sockets.map((socket) => socket.data.userId))] },
        attributes: ['id', 'isBlocked'],
      });
      for (const socket of sockets) {
        const user = users.find((item) => item.id === socket.data.userId);
        if (!user) closeSocket(socket, ApiError.unauthorized('User no longer exists'));
        else if (user.isBlocked) closeSocket(socket, ApiError.forbidden('Your account has been blocked'));
        else if (socket.data.expiresAt && socket.data.expiresAt <= Date.now()) closeSocket(socket, ApiError.unauthorized('Invalid or expired token'));
        else if (!participantRole(order, user.id)) closeSocket(socket, ApiError.forbidden('Only the client and the assigned freelancer can access this chat'));
        else socket.emit('message:new', message);
      }
    } catch (error) {
      // The POST already saved the message. Reconnection/Refresh can recover it.
      console.error('Chat delivery failed:', error);
    }
  };

  const disconnectBlocked = (userId) => {
    io.to(`user:${userId}`).emit('chat:error', errorBody(ApiError.forbidden('Your account has been blocked')));
    io.in(`user:${userId}`).disconnectSockets(true);
  };

  chatEvents.on('message:created', publishMessage);
  chatEvents.on('user:blocked', disconnectBlocked);
  // Clean up listeners when the HTTP server is shut down in development/tests.
  server.on('close', () => {
    chatEvents.off('message:created', publishMessage);
    chatEvents.off('user:blocked', disconnectBlocked);
  });
  return io;
};

module.exports = { attachChat };
