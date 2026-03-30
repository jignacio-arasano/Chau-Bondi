const jwt = require('jsonwebtoken');

// ─── CORS ────────────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function getUser(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Handler wrapper ─────────────────────────────────────────────────────────
// Envuelve cada función con CORS automático y manejo de OPTIONS
function withCors(handler) {
  return async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    return handler(req, res);
  };
}

// Handler con auth obligatorio
function withAuth(handler) {
  return withCors(async (req, res) => {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'Token requerido.' });
    req.user = user;
    return handler(req, res);
  });
}

module.exports = { withCors, withAuth, getUser };
