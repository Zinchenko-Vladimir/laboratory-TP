'use strict';
// Вариант 4 (базовый): вход в кабинет преподавателя, имя и роль после проверки.
// Серверная сессия + cookie HttpOnly/SameSite. Без внешних зависимостей (только Node.js).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3001;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 15 * 60 * 1000;
const SECURE = process.env.SECURE === '1'; // включить при работе по HTTPS
const PUBLIC_DIR = path.join(__dirname, 'public');
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
const sessions = new Map(); // sid -> { login, expiresAt }

// ---------- пароли ----------
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
const DUMMY_HASH = users[0].passwordHash; // чтобы время ответа не выдавало, существует ли логин

// ---------- вспомогательные ----------
function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': typeof body === 'string' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(data);
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
function sessionCookie(sid, maxAgeSec) {
  return `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}${SECURE ? '; Secure' : ''}`;
}
// Возвращает пользователя или null; отличает «нет cookie» и «сессия истекла»
function authenticate(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return { error: 'unauthorized' };
  const s = sessions.get(sid);
  if (!s) return { error: 'session_expired' };
  if (Date.now() > s.expiresAt) { sessions.delete(sid); return { error: 'session_expired' }; }
  const user = users.find((u) => u.login === s.login);
  return user ? { user, sid } : { error: 'unauthorized' };
}
const publicUser = (u) => ({ login: u.login, name: u.name, role: u.role });

// ---------- маршруты ----------
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

    const sid = crypto.randomBytes(32).toString('hex');
    sessions.set(sid, { login: user.login, expiresAt: Date.now() + SESSION_TTL_MS });
    return send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(sid, Math.floor(SESSION_TTL_MS / 1000)) });
  }

  if (req.method === 'GET' && pathname === '/api/profile') {
    const a = authenticate(req);
    if (!a.user) return send(res, 401, { error: a.error, message: a.error === 'session_expired' ? 'Сессия истекла, войдите снова' : 'Требуется вход' });
    return send(res, 200, { user: publicUser(a.user) });
  }

  if (req.method === 'GET' && pathname === '/api/teacher/groups') {
    const a = authenticate(req);
    if (!a.user) return send(res, 401, { error: a.error, message: 'Требуется вход' });
    if (a.user.role !== 'teacher') return send(res, 403, { error: 'forbidden', message: 'Раздел доступен только преподавателю' });
    return send(res, 200, { groups: ['ИС-25-21', 'ИС-25-22', 'ПО-25-11'] });
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    const sid = parseCookies(req).sid;
    if (sid) sessions.delete(sid);
    return send(res, 200, { message: 'Вы вышли из системы' }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  return send(res, 404, { error: 'not_found' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, { error: 'forbidden' });
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, { error: 'not_found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return handleApi(req, res).catch(() => send(res, 500, { error: 'server_error' }));
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  serveStatic(req, res);
});

if (require.main === module) server.listen(PORT, () => console.log(`Откройте http://localhost:${PORT}`));
module.exports = server;
