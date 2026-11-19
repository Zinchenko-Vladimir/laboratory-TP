'use strict';
// Вариант 14 (средний): панель администратора, защита маршрута и проверка прав на сервере.
// Серверная сессия (cookie HttpOnly/SameSite=Strict), скользящий тайм-аут, роли admin/user.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3014;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 15 * 60 * 1000; // тайм-аут бездействия
const SECURE = process.env.SECURE === '1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const PRIVATE_DIR = path.join(__dirname, 'private'); // admin.html отдаётся ТОЛЬКО через защищённый маршрут
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
const sessions = new Map(); // sid -> { login, lastSeen }

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
const DUMMY_HASH = users[0].passwordHash;

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string';
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 10_000) { reject(new Error('too_large')); req.destroy(); } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('bad_json')); } });
  });
}
const sessionCookie = (sid, maxAgeSec) => `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}${SECURE ? '; Secure' : ''}`;
const publicUser = (u) => ({ login: u.login, name: u.name, role: u.role });
const messageFor = (code) => ({ session_expired: 'Сессия истекла, войдите снова', unauthorized: 'Требуется вход' }[code] || 'Ошибка');

// Единая проверка: кто пользователь? (скользящий тайм-аут обновляется при каждом запросе)
function authenticate(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return { error: 'unauthorized' };
  const s = sessions.get(sid);
  if (!s) return { error: 'session_expired' };
  if (Date.now() - s.lastSeen > SESSION_TTL_MS) { sessions.delete(sid); return { error: 'session_expired' }; }
  const user = users.find((u) => u.login === s.login);
  if (!user || user.blocked) { sessions.delete(sid); return { error: 'unauthorized' }; }
  s.lastSeen = Date.now();
  return { user, sid };
}
// Единая проверка роли: 401 — не вошёл, 403 — вошёл, но прав нет
function requireRole(req, res, role) {
  const a = authenticate(req);
  if (!a.user) { send(res, 401, { error: a.error, message: messageFor(a.error) }); return null; }
  if (a.user.role !== role) { send(res, 403, { error: 'forbidden', message: 'Недостаточно прав' }); return null; }
  return a.user;
}

async function handleApi(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && pathname === '/api/login') {
    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: 'bad_request', message: 'Некорректный запрос' }); }
    const login = typeof body.login === 'string' ? body.login.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!login || !password) return send(res, 400, { error: 'empty_fields', message: 'Введите логин и пароль' });
    const user = users.find((u) => u.login === login);
    const ok = verifyPassword(password, (user || { passwordHash: DUMMY_HASH }).passwordHash) && !!user;
    if (!ok) return send(res, 401, { error: 'invalid_credentials', message: 'Неверный логин или пароль' });
    if (user.blocked) return send(res, 403, { error: 'blocked', message: 'Учётная запись заблокирована администратором' });
    const sid = crypto.randomBytes(32).toString('hex');
    sessions.set(sid, { login: user.login, lastSeen: Date.now() });
    return send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(sid, Math.floor(SESSION_TTL_MS / 1000)) });
  }

  if (req.method === 'GET' && pathname === '/api/profile') {
    const a = authenticate(req);
    if (!a.user) return send(res, 401, { error: a.error, message: messageFor(a.error) });
    return send(res, 200, { user: publicUser(a.user) });
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    const sid = parseCookies(req).sid;
    if (sid) sessions.delete(sid);
    return send(res, 200, { message: 'Вы вышли из системы' }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  // ----- админские API -----
  if (req.method === 'GET' && pathname === '/api/admin/users') {
    if (!requireRole(req, res, 'admin')) return;
    return send(res, 200, { users: users.map((u) => ({ ...publicUser(u), blocked: !!u.blocked })) });
  }

  const m = pathname.match(/^\/api\/admin\/users\/([\w.-]+)\/block$/);
  if (req.method === 'POST' && m) {
    const admin = requireRole(req, res, 'admin');
    if (!admin) return;
    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: 'bad_request', message: 'Некорректный запрос' }); }
    const target = users.find((u) => u.login === m[1]);
    if (!target) return send(res, 404, { error: 'not_found', message: 'Пользователь не найден' });
    if (target.login === admin.login) return send(res, 400, { error: 'self_block', message: 'Нельзя заблокировать себя' });
    target.blocked = body.blocked === true;
    if (target.blocked) for (const [sid, s] of sessions) if (s.login === target.login) sessions.delete(sid); // сразу закрываем сессии
    return send(res, 200, { user: { ...publicUser(target), blocked: target.blocked } });
  }

  return send(res, 404, { error: 'not_found' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
function serveFile(res, dir, rel) {
  const file = path.normalize(path.join(dir, rel));
  if (!file.startsWith(dir + path.sep)) return send(res, 403, { error: 'forbidden' });
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, { error: 'not_found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}
const denyPage = (title, text) => `<!DOCTYPE html><html lang="ru"><meta charset="UTF-8"><title>${title}</title><link rel="stylesheet" href="/style.css"><body><main><div class="card"><h1>${title}</h1><p>${text}</p><p><a href="/">На главную</a></p></div></main></body></html>`;

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname.startsWith('/api/')) return handleApi(req, res).catch(() => send(res, 500, { error: 'server_error' }));
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });

  // Защита МАРШРУТА: страница админки не лежит в public и отдаётся только администратору
  if (pathname === '/admin') {
    const a = authenticate(req);
    if (!a.user) return send(res, 401, denyPage('401 — требуется вход', 'Войдите в систему, чтобы продолжить.'));
    if (a.user.role !== 'admin') return send(res, 403, denyPage('403 — доступ запрещён', 'Эта страница доступна только администратору.'));
    return serveFile(res, PRIVATE_DIR, 'admin.html');
  }
  if (pathname === '/admin.js') {
    const a = authenticate(req);
    if (!a.user || a.user.role !== 'admin') return send(res, a.user ? 403 : 401, { error: 'forbidden' });
    return serveFile(res, PRIVATE_DIR, 'admin.js');
  }
  serveFile(res, PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname.slice(1));
});

if (require.main === module) server.listen(PORT, () => console.log(`Откройте http://localhost:${PORT}`));
module.exports = server;
