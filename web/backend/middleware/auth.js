const jwt = require('jsonwebtoken');

// 生产环境务必通过环境变量覆盖 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'parent-learning-dev-secret-change-me';
const TOKEN_TTL = '30d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Express 中间件：校验 Authorization: Bearer <token>
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.uid;
    req.username = decoded.username;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

module.exports = { signToken, authRequired, JWT_SECRET };
