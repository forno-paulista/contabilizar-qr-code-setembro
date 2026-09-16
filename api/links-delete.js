import { isAuthenticated } from '../lib/auth.js';
import { deleteLink } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).send('Não autenticado.');
    return;
  }

  const slug = (req.body?.slug || '').trim();
  if (slug) {
    await deleteLink(slug);
  }

  res.writeHead(303, { Location: '/stats' });
  res.end();
}
