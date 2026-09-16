import { isAuthenticated } from '../lib/auth.js';
import { listLinks } from '../lib/store.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function page(body, extraStyle = '') {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Painel QR Code</title>
<style>
  :root {
    --accent: #c65d2e;
    --accent-dark: #a84a21;
    --bg: #faf6f2;
    --card: #ffffff;
    --border: #e8ddd3;
    --text: #2b2420;
    --muted: #8a7d72;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 20px 14px 60px;
  }
  .wrap { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h1 a { font-size: 14px; color: var(--muted); text-decoration: none; }
  h1 a:hover { color: var(--accent); }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
  .add-card { margin-bottom: 18px; }
  .add-form { display: flex; gap: 10px; flex-wrap: wrap; }
  .add-form input {
    flex: 1; min-width: 140px; padding: 11px 12px; border: 1px solid var(--border);
    border-radius: 10px; font-size: 15px; background: #fff; color: var(--text);
  }
  .add-form input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  button, .btn {
    padding: 11px 18px; border-radius: 10px; border: none; background: var(--accent);
    color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  button:hover, .btn:hover { background: var(--accent-dark); }
  button:disabled { opacity: .6; cursor: default; }
  button.secondary, .btn.secondary { background: #fff; color: var(--text); border: 1px solid var(--border); }
  button.secondary:hover { background: var(--bg); }
  .erro { color: #b3261e; background: #fdecea; border: 1px solid #f3c8c4; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 14px; }
  .muted { color: var(--muted); font-size: 13px; }
  .table { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--card); margin-top: 4px; }
  .row {
    display: grid; grid-template-columns: 1.1fr 1.8fr 1.8fr .6fr 1.3fr;
    gap: 10px; padding: 14px 16px; align-items: center; border-bottom: 1px solid var(--border);
  }
  .row:last-child { border-bottom: none; }
  .row.header { background: #f7f1eb; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
  .cell-label { display: none; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; letter-spacing: .03em; }
  .trackurl { word-break: break-all; font-size: 14px; color: var(--accent-dark); text-decoration: none; }
  .trackurl:hover { text-decoration: underline; }
  .copy-btn { margin-top: 6px; padding: 5px 10px; font-size: 12px; background: var(--bg); color: var(--text); border: 1px solid var(--border); }
  .copy-btn:hover { background: #fff; }
  .dest { font-size: 14px; color: var(--muted); text-decoration: none; word-break: break-all; }
  .clicks { font-size: 20px; font-weight: 700; }
  .qr-thumb-wrap { position: relative; width: 64px; height: 64px; }
  .qr-thumb-wrap img { width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); display: block; }
  .spinner {
    width: 22px; height: 22px; border: 3px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: spin .7s linear infinite; position: absolute; top: 21px; left: 21px;
  }
  .qr-thumb-wrap.loaded .spinner { display: none; }
  .qr-thumb-wrap:not(.loaded) img { opacity: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner-inline {
    display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.5);
    border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; margin-right: 6px; vertical-align: -2px;
  }
  .ver-qr-btn { margin-top: 6px; font-size: 12px; padding: 5px 10px; }
  .empty { padding: 30px 16px; text-align: center; color: var(--muted); }

  #qr-modal {
    position: fixed; inset: 0; background: rgba(20,15,10,.6); display: flex;
    align-items: center; justify-content: center; padding: 20px; z-index: 50;
  }
  #qr-modal[hidden] { display: none; }
  #qr-modal .box { background: #fff; border-radius: 16px; padding: 24px; max-width: 360px; width: 100%; text-align: center; }
  #qr-modal img { width: 100%; max-width: 280px; border-radius: 8px; border: 1px solid var(--border); }
  #qr-modal .actions { display: flex; gap: 10px; margin-top: 16px; justify-content: center; flex-wrap: wrap; }

  @media (max-width: 680px) {
    body { padding: 14px 10px 50px; }
    .row.header { display: none; }
    .row { grid-template-columns: 1fr; gap: 10px; }
    .cell-label { display: block; }
    .add-form { flex-direction: column; }
    .add-form button { width: 100%; }
  }
  ${extraStyle}
</style></head>
<body><div class="wrap">${body}</div></body></html>`;
}

function loginPage(erro) {
  return page(`
    <h1>Painel QR Code</h1>
    <div class="card" style="max-width:360px;margin:60px auto 0">
      ${erro ? '<p class="erro">Senha incorreta.</p>' : ''}
      <form method="POST" action="/api/login" id="login-form">
        <input type="password" name="senha" placeholder="Senha" style="width:100%;padding:11px 12px;border:1px solid var(--border);border-radius:10px;font-size:15px" autofocus>
        <button type="submit" id="login-btn" style="width:100%;margin-top:10px">Entrar</button>
      </form>
    </div>
    <script>
      document.getElementById('login-form').addEventListener('submit', function () {
        var btn = document.getElementById('login-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-inline"></span>Entrando...';
      });
    </script>
  `);
}

function adminPage({ links, erro }) {
  const erroMsg = {
    campos: 'Preencha nome e URL de destino.',
    url: 'URL de destino inválida.',
  }[erro];

  const rows = links
    .map((l) => {
      const trackUrl = `/qr/${l.slug}`;
      const trackUrlFull = trackUrl; // relative, resolved client-side against current origin
      return `
        <div class="row">
          <div>
            <div class="cell-label">Nome</div>
            ${escapeHtml(l.slug)}
          </div>
          <div>
            <div class="cell-label">Link rastreável</div>
            <a class="trackurl" href="${trackUrl}" target="_blank">${escapeHtml(trackUrl)}</a><br>
            <button type="button" class="copy-btn" data-url="${escapeHtml(trackUrl)}">Copiar link</button>
          </div>
          <div>
            <div class="cell-label">Destino</div>
            <a class="dest" href="${escapeHtml(l.url)}" target="_blank">${escapeHtml(l.url)}</a>
          </div>
          <div>
            <div class="cell-label">Cliques</div>
            <span class="clicks">${l.clicks}</span>
          </div>
          <div>
            <div class="cell-label">QR code</div>
            <div class="qr-thumb-wrap">
              <div class="spinner"></div>
              <img src="/api/qr?slug=${encodeURIComponent(l.slug)}&size=140" alt="QR ${escapeHtml(l.slug)}"
                   onload="this.parentElement.classList.add('loaded')"
                   onerror="this.parentElement.classList.add('loaded')">
            </div>
            <button type="button" class="btn secondary ver-qr-btn" data-slug="${escapeHtml(l.slug)}">Ver grande</button>
          </div>
        </div>
      `;
    })
    .join('');

  return page(`
    <h1>Painel QR Code <a href="/api/logout">Sair</a></h1>

    ${erroMsg ? `<p class="erro">${erroMsg}</p>` : ''}

    <div class="card add-card">
      <form class="add-form" id="add-form" method="POST" action="/api/links-create">
        <input type="text" name="nome" placeholder="Nome (ex: Instagram)" required>
        <input type="url" name="url" placeholder="https://instagram.com/fornopaulista" required>
        <button type="submit" id="add-btn">Adicionar link</button>
      </form>
    </div>

    <div class="table">
      <div class="row header">
        <div>Nome</div><div>Link rastreável</div><div>Destino</div><div>Cliques</div><div>QR code</div>
      </div>
      ${rows || '<div class="empty">Nenhum link cadastrado ainda.</div>'}
    </div>
    <p class="muted" style="margin-top:12px">Atualize a página para ver números novos.</p>

    <div id="qr-modal" hidden>
      <div class="box">
        <img id="qr-modal-img" src="" alt="QR code">
        <div class="actions">
          <a class="btn" id="qr-modal-download" href="#" download>Baixar PNG</a>
          <button type="button" class="btn secondary" id="qr-modal-close">Fechar</button>
        </div>
      </div>
    </div>

    <script>
      document.getElementById('add-form').addEventListener('submit', function () {
        var btn = document.getElementById('add-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-inline"></span>Adicionando...';
      });

      document.querySelectorAll('.copy-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var full = window.location.origin + btn.dataset.url;
          navigator.clipboard.writeText(full).then(function () {
            var original = btn.textContent;
            btn.textContent = 'Copiado!';
            setTimeout(function () { btn.textContent = original; }, 1500);
          });
        });
      });

      var modal = document.getElementById('qr-modal');
      var modalImg = document.getElementById('qr-modal-img');
      var modalDownload = document.getElementById('qr-modal-download');

      document.querySelectorAll('.ver-qr-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.dataset.slug;
          modalImg.src = '/api/qr?slug=' + encodeURIComponent(slug) + '&size=600';
          modalDownload.href = '/api/qr?slug=' + encodeURIComponent(slug) + '&size=1000&download=1';
          modal.hidden = false;
        });
      });
      document.getElementById('qr-modal-close').addEventListener('click', function () {
        modal.hidden = true;
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.hidden = true;
      });
    </script>
  `);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!isAuthenticated(req)) {
    const erro = req.query.erro === 'senha';
    res.status(200).send(loginPage(erro));
    return;
  }

  const links = await listLinks();
  res.status(200).send(adminPage({ links, erro: req.query.erro }));
}
