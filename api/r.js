import { Redis } from '@upstash/redis';
import { getLink } from '../lib/store.js';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const slug = req.query.slug;
  const link = await getLink(slug);

  if (!link) {
    res.status(404).send('Link não encontrado.');
    return;
  }

  const entry = JSON.stringify({
    at: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    ua: req.headers['user-agent'] || null,
    ref: req.headers['referer'] || null,
  });

  await Promise.all([
    redis.incr(`clicks:${slug}`),
    redis.lpush(`log:${slug}`, entry),
    redis.ltrim(`log:${slug}`, 0, 999),
  ]);

  const destination = new URL(link.url);
  destination.searchParams.set('utm_source', 'qrcode');
  destination.searchParams.set('utm_medium', 'qrcode');
  destination.searchParams.set('utm_campaign', link.utmCampaign || `qrcode_${slug}`);

  res.writeHead(302, { Location: destination.toString() });
  res.end();
}
