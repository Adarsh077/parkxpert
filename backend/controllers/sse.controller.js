const uuid = require('uuid').v4;

const { sseService } = require('../services');
const { catchAsync } = require('../utils');

exports.subscribe = catchAsync(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream; charset=utf8');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = `${uuid()}`;
  sseService.registerClient({
    clientId,
    response: res,
  });

  res.on('close', () => {
    sseService.removeClient({ clientId });
    res.end();
  });
});
