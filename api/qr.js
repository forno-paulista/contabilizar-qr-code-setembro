import QRCode from 'qrcode';
import { isAuthenticated } from '../lib/auth.js';
import { getLink } from '../lib/store.js';

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).send('Não autenticado.');
    return;
  }

  const slug = req.query.slug;
  const link = await getLink(slug);
  if (!link) {
    res.status(404).send('Link não encontrado.');
    return;
  }

  const size = Math.min(Math.max(Number(req.query.size) || 300, 64), 1200);
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const trackUrl = `${proto}://${req.headers.host}/qr/${slug}`;

  const buffer = await QRCode.toBuffer(trackUrl, {
    type: 'png',
    width: size,
    margin: 1,
  });

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  if (req.query.download) {
    res.setHeader('Content-Disposition', `attachment; filename="qr-${slug}.png"`);
  }
  res.status(200).send(buffer);
}
