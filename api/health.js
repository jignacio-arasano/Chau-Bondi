const { withCors } = require('./_lib/middleware');
module.exports = withCors((req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
