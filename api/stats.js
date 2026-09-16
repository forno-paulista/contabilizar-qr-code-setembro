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
<link rel="icon" href="/logo.png">
<meta name="theme-color" content="#c1272d">
<title>Painel QR Code</title>
<style>
  :root {
    --accent: #d3452b;
    --accent-dark: #a82f1c;
    --flame: #f2a83e;
    --bg: #faf5ef;
    --card: #ffffff;
    --border: #ecdfd2;
    --text: #2a1810;
    --muted: #8a7466;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 16px 14px 60px;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  h1 {
    font-size: 18px; margin: 0; display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 10px 0;
  }
  h1 a { font-size: 14px; color: var(--muted); text-decoration: none; padding: 8px 4px; }
  h1 a:hover { color: var(--accent); }
  .brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .brand span.txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .brand-logo { height: 28px; width: auto; display: block; flex-shrink: 0; }
  .brand-logo.big { height: 72px; margin: 0 auto 10px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
  .add-form { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
  .add-form input {
    flex: 1; min-width: 140px; padding: 13px 12px; border: 1px solid var(--border);
    border-radius: 10px; font-size: 16px; background: #fff; color: var(--text); min-height: 48px;
  }
  .add-form input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  button, .btn {
    padding: 13px 20px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, var(--flame), var(--accent));
    color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; white-space: nowrap;
    min-height: 48px; display: inline-flex; align-items: center; justify-content: center;
  }
  button:hover, .btn:hover { background: var(--accent-dark); }
  button:disabled { opacity: .6; cursor: default; }
  button.secondary, .btn.secondary { background: #fff; color: var(--text); border: 1px solid var(--border); }
  button.secondary:hover { background: var(--bg); }
  .erro { color: #b3261e; background: #fdecea; border: 1px solid #f3c8c4; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; font-size: 14px; }
  .muted { color: var(--muted); font-size: 13px; }

  .topbar { position: sticky; top: 0; background: var(--bg); z-index: 20; padding-bottom: 10px; margin-bottom: 16px; }
  .topbar::after { content: ''; display: block; height: 1px; background: var(--border); margin-top: 10px; }
  .topbar-row2 { display: flex; align-items: center; gap: 10px; }
  .add-trigger-btn { flex: 1; min-height: 44px; padding: 10px 16px; font-size: 15px; }
  .refresh-btn { min-height: 44px; padding: 10px 16px; font-size: 14px; flex-shrink: 0; }

  .link-list { display: flex; flex-direction: column; gap: 12px; }
  .link-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
  .link-card-head { display: flex; align-items: center; gap: 12px; }
  .link-card-head .qr-thumb-wrap { width: 48px; height: 48px; flex-shrink: 0; }
  .link-card-head .qr-thumb-wrap img { width: 48px; height: 48px; }
  .link-card-head .qr-thumb-wrap .spinner { width: 18px; height: 18px; top: 15px; left: 15px; }
  .link-card-name { font-weight: 700; font-size: 16px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .clicks-badge {
    background: linear-gradient(135deg, var(--flame), var(--accent)); color: #fff; font-weight: 700;
    font-size: 13px; padding: 6px 12px; border-radius: 999px; flex-shrink: 0; white-space: nowrap;
  }
  .link-card-body { margin-top: 10px; font-size: 13px; }
  .link-line { display: flex; gap: 6px; align-items: baseline; min-width: 0; margin-top: 4px; }
  .link-line .line-label { color: var(--muted); flex-shrink: 0; }
  .link-line a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; }
  .link-line a.trackurl { color: var(--accent-dark); }
  .link-line a.dest { color: var(--muted); }
  .link-card-actions { display: flex; gap: 8px; margin-top: 12px; }
  .link-card-actions button { flex: 1; padding: 9px 10px; font-size: 13px; min-height: 40px; }
  .qr-thumb-wrap { position: relative; width: 72px; height: 72px; }
  .qr-thumb-wrap img { width: 72px; height: 72px; border-radius: 8px; border: 1px solid var(--border); display: block; }
  .spinner {
    width: 22px; height: 22px; border: 3px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: spin .7s linear infinite; position: absolute; top: 25px; left: 25px;
  }
  .qr-thumb-wrap.loaded .spinner { display: none; }
  .qr-thumb-wrap:not(.loaded) img { opacity: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner-inline {
    display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.5);
    border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; margin-right: 6px; vertical-align: -2px;
  }
  .spinner-inline.dark { border-color: rgba(0,0,0,.15); border-top-color: var(--text); }
  .empty { padding: 36px 16px; text-align: center; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: 14px; }

  #qr-modal, #add-modal {
    position: fixed; inset: 0; background: rgba(20,15,10,.6); display: flex;
    align-items: center; justify-content: center; padding: 20px; z-index: 50;
  }
  #qr-modal[hidden], #add-modal[hidden] { display: none; }
  #qr-modal .box, #add-modal .box { background: #fff; border-radius: 16px; padding: 24px; max-width: 360px; width: 100%; text-align: center; }
  #qr-modal img { width: 100%; max-width: 280px; border-radius: 8px; border: 1px solid var(--border); }
  #qr-modal .actions { display: flex; gap: 10px; margin-top: 16px; justify-content: center; flex-wrap: wrap; }
  #add-modal .box { text-align: left; }
  #add-modal .box h2 { font-size: 17px; margin: 0 0 4px; }
  #add-modal .add-form { margin-top: 10px; flex-direction: column; }
  #add-modal .add-form input, #add-modal .add-form button { width: 100%; }
  #add-modal .close-row { text-align: right; margin-top: -6px; }
  #add-modal .close-row button { min-height: 36px; padding: 6px 12px; font-size: 13px; }

  @media (max-width: 680px) {
    body { padding: 12px 10px 50px; }
    h1 { font-size: 17px; }
    #qr-modal .actions { flex-direction: column; }
    #qr-modal .actions .btn { width: 100%; }
  }
  ${extraStyle}
</style></head>
<body><div class="wrap">${body}</div></body></html>`;
}

function loginPage(erro) {
  return page(`
    <div class="card" style="max-width:360px;margin:60px auto 0;text-align:center">
      <img class="brand-logo big" src="/logo.png" alt="Forno Paulista" onerror="this.style.display='none'">
      <h1 style="justify-content:center;padding:0">Painel QR Code</h1>
      ${erro ? '<p class="erro">Senha incorreta.</p>' : ''}
      <form method="POST" action="/api/login" id="login-form">
        <input type="password" name="senha" placeholder="Senha" style="width:100%;padding:13px 12px;border:1px solid var(--border);border-radius:10px;font-size:16px;min-height:48px" autofocus>
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
  const openAddModal = Boolean(erroMsg);

  const cards = links
    .map((l) => {
      const trackUrl = `/qr/${l.slug}`;
      const clicksLabel = l.clicks === 1 ? 'clique' : 'cliques';
      return `
        <div class="link-card">
          <div class="link-card-head">
            <div class="qr-thumb-wrap">
              <div class="spinner"></div>
              <img src="/api/qr?slug=${encodeURIComponent(l.slug)}&size=100" alt="QR ${escapeHtml(l.slug)}"
                   onload="this.parentElement.classList.add('loaded')"
                   onerror="this.parentElement.classList.add('loaded')">
            </div>
            <div class="link-card-name" title="${escapeHtml(l.slug)}">${escapeHtml(l.slug)}</div>
            <div class="clicks-badge">${l.clicks} ${clicksLabel}</div>
          </div>
          <div class="link-card-body">
            <div class="link-line">
              <span class="line-label">Link:</span>
              <a class="trackurl" href="${trackUrl}" target="_blank" title="${trackUrl}">${escapeHtml(trackUrl)}</a>
            </div>
            <div class="link-line">
              <span class="line-label">Destino:</span>
              <a class="dest" href="${escapeHtml(l.url)}" target="_blank" title="${escapeHtml(l.url)}">${escapeHtml(l.url)}</a>
            </div>
          </div>
          <div class="link-card-actions">
            <button type="button" class="secondary copy-btn" data-url="${escapeHtml(trackUrl)}">Copiar link</button>
            <button type="button" class="secondary ver-qr-btn" data-slug="${escapeHtml(l.slug)}">Ver QR grande</button>
          </div>
        </div>
      `;
    })
    .join('');

  return page(`
    <div class="topbar">
      <h1>
        <span class="brand"><img class="brand-logo" src="/logo.png" alt="Forno Paulista" onerror="this.style.display='none'"><span class="txt">Painel QR Code</span></span>
        <a href="/api/logout">Sair</a>
      </h1>
      <div class="topbar-row2">
        <button type="button" class="add-trigger-btn" id="open-add-modal">+ Adicionar link</button>
        <button type="button" class="secondary refresh-btn" id="refresh-btn">Atualizar</button>
      </div>
    </div>

    <div class="link-list">
      ${cards || '<div class="empty">Nenhum link cadastrado ainda.</div>'}
    </div>

    <div id="add-modal" ${openAddModal ? '' : 'hidden'}>
      <div class="box">
        <div class="close-row"><button type="button" class="secondary" id="add-modal-close">Fechar</button></div>
        <h2>Adicionar link</h2>
        ${erroMsg ? `<p class="erro">${erroMsg}</p>` : ''}
        <form class="add-form" id="add-form" method="POST" action="/api/links-create">
          <input type="text" name="nome" placeholder="Nome (ex: Instagram)" required>
          <input type="url" name="url" placeholder="https://instagram.com/fornopaulista" required>
          <button type="submit" id="add-btn">Adicionar link</button>
        </form>
      </div>
    </div>

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
      var addModal = document.getElementById('add-modal');
      document.getElementById('open-add-modal').addEventListener('click', function () {
        addModal.hidden = false;
      });
      document.getElementById('add-modal-close').addEventListener('click', function () {
        addModal.hidden = true;
      });
      addModal.addEventListener('click', function (e) {
        if (e.target === addModal) addModal.hidden = true;
      });

      document.getElementById('add-form').addEventListener('submit', function () {
        var btn = document.getElementById('add-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-inline"></span>Adicionando...';
      });

      document.getElementById('refresh-btn').addEventListener('click', function () {
        var btn = document.getElementById('refresh-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-inline dark"></span>Atualizando...';
        window.location.reload();
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
