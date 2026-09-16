import { setSessionCookie } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const senha = req.body?.senha;

  if (!senha || senha !== process.env.ADMIN_PASSWORD) {
    res.writeHead(303, { Location: '/stats?erro=senha' });
    res.end();
    return;
  }

  setSessionCookie(res);
  res.writeHead(303, { Location: '/stats' });
  res.end();
}
