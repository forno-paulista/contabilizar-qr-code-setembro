import { clearSessionCookie } from '../lib/auth.js';

export default async function handler(req, res) {
  clearSessionCookie(res);
  res.writeHead(303, { Location: '/stats' });
  res.end();
}
