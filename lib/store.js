import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const HASH_KEY = 'qr_links';

export function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parse(raw) {
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function listLinks() {
  const raw = await redis.hgetall(HASH_KEY);
  const entries = Object.entries(raw || {});

  const links = await Promise.all(
    entries.map(async ([slug, value]) => {
      const data = parse(value);
      const clicks = Number((await redis.get(`clicks:${slug}`)) || 0);
      return { slug, url: data.url, utmCampaign: data.utmCampaign, createdAt: data.createdAt, clicks };
    })
  );

  return links.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

export async function getLink(slug) {
  const raw = await redis.hget(HASH_KEY, slug);
  return raw ? parse(raw) : null;
}

export async function createLink(name, url) {
  let base = slugify(name);
  if (!base) base = slugify(new URL(url).hostname);

  let slug = base;
  let n = 2;
  while (await redis.hexists(HASH_KEY, slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }

  const data = {
    url,
    utmCampaign: `qrcode_${slug.replace(/-/g, '_')}`,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(HASH_KEY, { [slug]: JSON.stringify(data) });
  return { slug, ...data };
}

export async function deleteLink(slug) {
  await Promise.all([
    redis.hdel(HASH_KEY, slug),
    redis.del(`clicks:${slug}`),
    redis.del(`log:${slug}`),
  ]);
}
