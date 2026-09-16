import { isAuthenticated } from '../lib/auth.js';
import { listLinks } from '../lib/store.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function page(body) {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 16px; color: #222; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: middle; }
  th { background: #f5f5f5; }
  input { padding: 8px; box-sizing: border-box; }
  button { padding: 8px 14px; cursor: pointer; }
  form.add-form { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  form.add-form input[name="nome"] { flex: 1; min-width: 160px; }
  form.add-form input[name="url"] { flex: 2; min-width: 220px; }
  .erro { color: #c00; }
  .muted { color: #888; font-size: 12px; }
  .del-btn { color: #c00; background: none; border: 1px solid #c00; border-radius: 4px; }
  a.trackurl { word-break: break-all; }
</style></head>
<body>${body}</body></html>`;
}

function loginPage(erro) {
  return page(`
    <h3>Painel QR Code</h3>
    ${erro ? '<p class="erro">Senha incorreta.</p>' : ''}
    <form method="POST" action="/api/login">
      <input type="password" name="senha" placeholder="Senha" style="width:100%" autofocus>
      <button style="margin-top:8px">Entrar</button>
    </form>
  `);
}

function adminPage({ links, baseUrl, erro }) {
  const erroMsg = {
    campos: 'Preencha nome e URL de destino.',
    url: 'URL de destino inválida.',
  }[erro];

  const rows = links
    .map((l) => {
      const trackUrl = `${baseUrl}/qr/${l.slug}`;
      const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackUrl)}`;
      return `
        <tr>
          <td>${escapeHtml(l.slug)}</td>
          <td><a class="trackurl" href="${trackUrl}" target="_blank">${trackUrl}</a>
            <div><button type="button" onclick="navigator.clipboard.writeText('${trackUrl}')">copiar</button></div>
          </td>
          <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">
            <a href="${escapeHtml(l.url)}" target="_blank">${escapeHtml(l.url)}</a>
          </td>
          <td style="text-align:right">${l.clicks}</td>
          <td><img src="${qrImg}" width="60" height="60" alt="QR"> <a href="${qrImg.replace('120x120', '600x600')}" target="_blank">baixar</a></td>
          <td>
            <form method="POST" action="/api/links-delete" onsubmit="return confirm('Tem certeza que quer excluir o link ${l.slug}?')">
              <input type="hidden" name="slug" value="${escapeHtml(l.slug)}">
              <button class="del-btn" type="submit">Excluir</button>
            </form>
          </td>
        </tr>
      `;
    })
    .join('');

  return page(`
    <h3>Painel QR Code <a href="/api/logout" style="float:right;font-size:14px">Sair</a></h3>

    ${erroMsg ? `<p class="erro">${erroMsg}</p>` : ''}

    <form class="add-form" method="POST" action="/api/links-create">
      <input type="text" name="nome" placeholder="Nome (ex: Instagram)" required>
      <input type="url" name="url" placeholder="https://instagram.com/fornopaulista" required>
      <button type="submit">Adicionar link</button>
    </form>

    <table>
      <tr><th>Nome</th><th>Link rastreável</th><th>Destino</th><th>Cliques</th><th>QR code</th><th></th></tr>
      ${rows || '<tr><td colspan="6" class="muted">Nenhum link cadastrado ainda.</td></tr>'}
    </table>
    <p class="muted">Atualize a página para ver números novos.</p>
  `);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!isAuthenticated(req)) {
    const erro = req.query.erro === 'senha';
    res.status(200).send(loginPage(erro));
    return;
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${proto}://${req.headers.host}`;
  const links = await listLinks();

  res.status(200).send(adminPage({ links, baseUrl, erro: req.query.erro }));
}
