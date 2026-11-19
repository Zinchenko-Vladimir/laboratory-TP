'use strict';
const $ = (s) => document.querySelector(s);
const statusEl = $('#status');
function setStatus(text, type = '') { statusEl.textContent = text; statusEl.className = 'status ' + type; }

async function api(url, options) {
  let res;
  try { res = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options }); }
  catch { return { status: 0, data: { message: 'Нет связи с сервером' } }; }
  let data = {};
  try { data = await res.json(); } catch { /* пусто */ }
  return { status: res.status, data };
}

function render(users) {
  const rows = $('#rows');
  rows.replaceChildren();
  for (const u of users) {
    const tr = document.createElement('tr');
    for (const text of [u.login, u.name, u.role, u.blocked ? 'заблокирован' : 'активен']) {
      const td = document.createElement('td'); td.textContent = text; tr.append(td);
    }
    const td = document.createElement('td');
    if (u.role !== 'admin') {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'secondary';
      btn.textContent = u.blocked ? 'Разблокировать' : 'Заблокировать';
      btn.addEventListener('click', () => toggle(u));
      td.append(btn);
    }
    tr.append(td); rows.append(tr);
  }
}

async function load() {
  const { status, data } = await api('/api/admin/users');
  if (status === 200) return render(data.users);
  setStatus(`Ошибка ${status}: ${data.message || 'нет доступа'}`, 'err');
  if (status === 401) setTimeout(() => { location.href = 'index.html'; }, 1500);
}

async function toggle(u) {
  const { status, data } = await api(`/api/admin/users/${encodeURIComponent(u.login)}/block`, { method: 'POST', body: JSON.stringify({ blocked: !u.blocked }) });
  if (status === 200) { setStatus(`Пользователь ${u.login}: ${data.user.blocked ? 'заблокирован' : 'разблокирован'}`, 'ok'); load(); }
  else setStatus(`Ошибка ${status}: ${data.message || 'отказ'}`, 'err');
}

$('#logout').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); location.href = 'index.html'; });
load();
