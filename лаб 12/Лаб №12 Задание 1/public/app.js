'use strict';
const $ = (s) => document.querySelector(s);
const form = $('#loginForm'), loginCard = $('#loginCard'), profileCard = $('#profileCard');
const statusEl = $('#status');
const ROLES = { teacher: 'Преподаватель', student: 'Студент' };

function setStatus(text, type = '') { statusEl.textContent = text; statusEl.className = 'status ' + type; }

function showProfile(user) {
  $('#pName').textContent = user.name;
  $('#pRole').textContent = ROLES[user.role] || user.role;
  $('#pLogin').textContent = user.login;
  $('#groups').replaceChildren();
  loginCard.hidden = true;
  profileCard.hidden = false;
}
function showLogin() {
  profileCard.hidden = true;
  loginCard.hidden = false;
  form.reset();
}

async function api(url, options) {
  let res;
  try { res = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options }); }
  catch { return { status: 0, data: { error: 'network', message: 'Нет связи с сервером. Запустите его (npm start) и откройте http://localhost:3001' } }; }
  let data = {};
  try { data = await res.json(); } catch { /* пустой ответ */ }
  return { status: res.status, data };
}

// Проверка сессии при загрузке/обновлении страницы
async function restoreSession() {
  const { status, data } = await api('/api/profile');
  if (status === 200) { showProfile(data.user); setStatus('Вы вошли в систему', 'ok'); }
  else if (data.error === 'session_expired') setStatus(data.message, 'err');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const login = $('#login').value.trim(), password = $('#password').value;
  if (!login || !password) return setStatus('Введите логин и пароль', 'err'); // проверка на клиенте — только для удобства
  const { status, data } = await api('/api/login', { method: 'POST', body: JSON.stringify({ login, password }) });
  if (status === 200) { showProfile(data.user); setStatus('Вход выполнен успешно', 'ok'); }
  else setStatus(data.message || 'Ошибка входа', 'err');
  $('#password').value = '';
});

$('#logout').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  showLogin();
  setStatus('Вы вышли из системы', 'ok');
});

$('#groupsBtn').addEventListener('click', async () => {
  const { status, data } = await api('/api/teacher/groups');
  const list = $('#groups');
  list.replaceChildren();
  if (status === 200) {
    for (const g of data.groups) { const li = document.createElement('li'); li.textContent = g; list.append(li); }
    setStatus('Список групп получен', 'ok');
  } else if (status === 401) { showLogin(); setStatus(data.message || 'Требуется вход', 'err'); }
  else setStatus(`Ошибка ${status}: ${data.message || 'доступ запрещён'}`, 'err');
});

restoreSession();

