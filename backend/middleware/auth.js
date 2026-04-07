import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rapor-olusturucu-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
}

export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
}

export { JWT_SECRET };
