import crypto from 'node:crypto';

/**
 * Very small token auth. Not production-grade — the assessment explicitly says
 * auth isn't the focus. A single hardcoded user logs in and receives an opaque
 * token that is accepted for the lifetime of the process.
 */
const validTokens = new Set();

export function makeAuth({ username, password }) {
  function login(req, res) {
    const { username: u, password: p } = req.body ?? {};
    if (u === username && p === password) {
      const token = crypto.randomBytes(24).toString('hex');
      validTokens.add(token);
      return res.json({ token, username: u });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  function requireAuth(req, res, next) {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token && validTokens.has(token)) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return { login, requireAuth };
}
