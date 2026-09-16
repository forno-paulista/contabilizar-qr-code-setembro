import { isAuthenticated } from '../lib/auth.js';
import { createLink } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).send('Não autenticado.');
    return;
  }

  const nome = (req.body?.nome || '').trim();
  const url = (req.body?.url || '').trim();

  if (!nome || !url) {
    res.writeHead(303, { Location: '/stats?erro=campos' });
    res.end();
    return;
  }

  try {
    new URL(url);
  } catch {
    res.writeHead(303, { Location: '/stats?erro=url' });
    res.end();
    return;
  }

  await createLink(nome, url);
  res.writeHead(303, { Location: '/stats' });
  res.end();
}
