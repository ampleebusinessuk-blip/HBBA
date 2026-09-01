import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRuntimeConfig } from './config.js';

const { jwtSecret, isProduction } = getRuntimeConfig();
const TOKEN_TTL = '7d';
export const COOKIE_NAME = 'hbba_token';

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

/**
 * `remember: false` issues a session cookie that dies with the browser, which
 * is what an unticked "Remember me" is supposed to do.
 */
export function setAuthCookie(res, token, { remember = true } = {}) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    ...(remember ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {})
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/* Attaches req.auth = { sub, role } if a valid token is present, else null. */
export function attachUser(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  req.auth = token ? verifyToken(token) : null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
