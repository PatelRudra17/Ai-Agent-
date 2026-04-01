// Redis is optional. If not configured, all exports are null.
// BullMQ job queues only work when Redis is available.

let redisConnection = null;
let messageQueue = null;
let callQueue = null;
let deadlineQueue = null;
let reportQueue = null;

console.log('Redis not configured — job queues disabled');

module.exports = {
  redisConnection,
  messageQueue,
  callQueue,
  deadlineQueue,
  reportQueue,
};
