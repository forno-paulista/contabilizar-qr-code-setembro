import crypto from 'crypto';

const COOKIE_NAME = 'qr_session';

function sign(secret) {
  return crypto.createHmac('sha256', secret).update('qr-tracker-admin').digest('hex');
}

export function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function isAuthenticated(req) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return false;

  const expected = sign(secret);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function setSessionCookie(res) {
  const token = sign(process.env.ADMIN_PASSWORD);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
  );
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
