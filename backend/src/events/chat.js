const { EventEmitter } = require('node:events');

// Domain events keep REST services independent of the socket server.
const chatEvents = new EventEmitter();

module.exports = { chatEvents };
