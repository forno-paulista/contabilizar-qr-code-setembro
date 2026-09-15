import { Redis } from '@upstash/redis';
import { links } from './links.js';

const redis = Redis.fromEnv();

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default async function handler(req, res) {
  const password = req.query.senha;

  if (password !== process.env.ADMIN_PASSWORD) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!doctype html><html><body style="font-family:sans-serif;max-width:400px;margin:80px auto;padding:0 16px">
      <h3>Estatísticas QR Code</h3>
      <form method="get">
        <input type="password" name="senha" placeholder="Senha" style="padding:8px;width:100%;box-sizing:border-box">
        <button style="margin-top:8px;padding:8px 16px">Entrar</button>
      </form>
      </body></html>
    `);
    return;
  }

  const slugs = Object.keys(links);
  const counts = await Promise.all(slugs.map((s) => redis.get(`clicks:${s}`)));

  const rows = slugs
    .map((slug, i) => ({ slug, total: Number(counts[i] || 0) }))
    .sort((a, b) => b.total - a.total)
    .map(
      (r) => `<tr><td>${escapeHtml(r.slug)}</td><td style="text-align:right">${r.total}</td></tr>`
    )
    .join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <!doctype html><html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;padding:0 16px">
    <h3>Cliques por QR Code</h3>
    <table style="width:100%;border-collapse:collapse" border="1" cellpadding="8">
      <tr><th>QR Code</th><th>Total de cliques</th></tr>
      ${rows}
    </table>
    <p style="color:#888;font-size:12px">Atualize a página para ver números novos.</p>
    </body></html>
  `);
}
