'use strict';
const $ = (s) => document.querySelector(s);
const form = $('#loginForm'), loginCard = $('#loginCard'), appCard = $('#appCard'), statusEl = $('#status');

// Access token живёт только в переменной (в памяти вкладки): не в localStorage и не в cookie.
let accessToken = null;
let ticker = null;

function setStatus(text, type = '') { statusEl.textContent = text; statusEl.className = 'status ' + type; }

function decodeClaims(token) {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(b64)))); // только отображение; доверять клиентскому разбору нельзя
}

function showSession(data) {
  accessToken = data.access_token;
  const c = decodeClaims(accessToken);
  $('#pName').textContent = data.user.name;
  $('#pRole').textContent = data.user.role;
  // в «claims» не показываем jti/sid целиком — только безопасные поля
  $('#claims').textContent = JSON.stringify({ iss: c.iss, aud: c.aud, sub: c.sub, role: c.role, iat: c.iat, exp: c.exp }, null, 2);
  loginCard.hidden = true; appCard.hidden = false;
  clearInterval(ticker);
  ticker = setInterval(() => {
    const left = c.exp - Math.floor(Date.now() / 1000);
    $('#ttl').textContent = left > 0 ? `истечёт через ${left} с` : 'истёк (будет обновлён при следующем запросе)';
  }, 500);
}
function showLogin(message, type = '') {
  accessToken = null; clearInterval(ticker);
  appCard.hidden = true; loginCard.hidden = false; form.reset();
  if (message) setStatus(message, type);
}

async function rawFetch(url, options = {}) {
  let res;
  try { res = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); }
  catch { return { status: 0, data: { error: 'network', message: 'Нет связи с сервером. Запустите его (npm start) и откройте http://localhost:3017' } }; }
  let data = {};
  try { data = await res.json(); } catch { /* пусто */ }
  return { status: res.status, data };
}

async function refresh() {
  const r = await rawFetch('/api/auth/refresh', { method: 'POST', headers: { 'X-Requested-With': 'fetch' } });
  if (r.status === 200) { showSession(r.data); console.log('[auth] токены обновлены (ротация refresh token)'); return true; }
  console.log('[auth] обновление не удалось:', r.data.error);
  return r.data;
}

// Запрос к защищённому API: при 401 с истёкшим access token один раз обновляем токен и повторяем запрос
async function authedFetch(url) {
  const call = () => rawFetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  let r = await call();
  if (r.status === 401 && r.data.error === 'token_expired') {
    const ok = await refresh();
    if (ok === true) r = await call();
    else { showLogin('Сессия истекла, войдите снова', 'err'); return null; }
  }
  if (r.status === 401) { showLogin(r.data.message || 'Требуется вход', 'err'); return null; }
  return r;
}

// Обновление страницы: access token в памяти пропал, но refresh cookie жива -> получаем новый access
(async function restore() {
  const ok = await refresh();
  if (ok === true) setStatus('Сессия восстановлена после обновления страницы', 'ok');
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const login = $('#login').value.trim(), password = $('#password').value;
  if (!login || !password) return setStatus('Введите логин и пароль', 'err');
  const r = await rawFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) });
  if (r.status === 200) { showSession(r.data); setStatus('Вход выполнен успешно', 'ok'); }
  else setStatus(r.data.message || 'Ошибка входа', 'err');
  $('#password').value = '';
});

$('#profileBtn').addEventListener('click', async () => {
  const r = await authedFetch('/api/profile');
  if (r) setStatus(r.status === 200 ? `Профиль получен: ${r.data.user.name}` : `Ошибка ${r.status}`, r.status === 200 ? 'ok' : 'err');
});
$('#reportBtn').addEventListener('click', async () => {
  const r = await authedFetch('/api/admin/report');
  if (!r) return;
  if (r.status === 200) setStatus(`Отчёт: активных сессий — ${r.data.report.activeSessions}`, 'ok');
  else setStatus(`Ошибка ${r.status}: ${r.data.message}`, 'err');
});
$('#refreshBtn').addEventListener('click', async () => {
  const ok = await refresh();
  setStatus(ok === true ? 'Токены обновлены' : (ok.message || 'Не удалось обновить'), ok === true ? 'ok' : 'err');
  if (ok !== true) showLogin(ok.message, 'err');
});
$('#logout').addEventListener('click', async () => {
  await rawFetch('/api/auth/logout', { method: 'POST', headers: { 'X-Requested-With': 'fetch' } });
  showLogin('Вы вышли из системы', 'ok');
});

