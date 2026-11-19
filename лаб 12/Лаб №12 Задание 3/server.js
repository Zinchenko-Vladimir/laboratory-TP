'use strict';
// Вариант 17 (повышенный): JWT с обновлением сессии.
//  - access token: короткоживущий JWT (HS256), хранится в памяти JS (не в localStorage), передаётся в Authorization: Bearer
//  - refresh token: случайная непрозрачная строка, cookie HttpOnly + SameSite=Strict + Path=/api/auth;
//    на сервере хранится только его SHA-256; при каждом обновлении выдаётся НОВЫЙ (ротация);
//    повторное использование старого токена = обнаружение кражи -> отзывается вся цепочка (семейство)
//  - выход отзывает семейство, поэтому уже выданные access token перестают приниматься сразу (проверка sid)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3017;
const ACCESS_TTL_S = Number(process.env.ACCESS_TTL_S) || 60;
const REFRESH_TTL_S = Number(process.env.REFRESH_TTL_S) || 7 * 24 * 3600;
// Секрет берётся из окружения; если не задан — генерируется при запуске (в репозитории секретов нет)
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ISSUER = 'lab12-demo', AUDIENCE = 'lab12-client';
const SECURE = process.env.SECURE === '1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));

const families = new Map();       // sid (семейство) -> { login, revoked }
const refreshTokens = new Map();  // sha256(refresh) -> { sid, used, expiresAt }
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const nowSec = () => Math.floor(Date.now() / 1000);

// ---------- JWT (HS256) ----------
const b64u = (v) => Buffer.from(v).toString('base64url');
function signJwt(payload) {
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}
class AuthError extends Error { constructor(code) { super(code); this.code = code; } }
function verifyJwt(token) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new AuthError('malformed_token');
  let header, payload;
  try { header = JSON.parse(Buffer.from(parts[0], 'base64url')); payload = JSON.parse(Buffer.from(parts[1], 'base64url')); }
  catch { throw new AuthError('malformed_token'); }
  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new AuthError('bad_algorithm'); // отсекаем alg=none и подмену алгоритма
  const expected = crypto.createHmac('sha256', SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = Buffer.from(parts[2], 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new AuthError('bad_signature');
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec()) throw new AuthError('token_expired');
  if (payload.iss !== ISSUER || payload.aud !== AUDIENCE) throw new AuthError('bad_claims');
  if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') throw new AuthError('bad_claims');
  const fam = families.get(payload.sid);
  if (!fam || fam.revoked) throw new AuthError('session_revoked'); // после выхода токен недействителен сразу
  return payload;
}
function issueAccess(user, sid) {
  const iat = nowSec();
  return signJwt({ iss: ISSUER, aud: AUDIENCE, sub: user.login, role: user.role, sid, jti: crypto.randomUUID(), iat, exp: iat + ACCESS_TTL_S });
}
function issueRefresh(sid) {
  const token = crypto.randomBytes(48).toString('base64url');
  refreshTokens.set(sha256(token), { sid, used: false, expiresAt: Date.now() + REFRESH_TTL_S * 1000 });
  return token;
}

// ---------- пароли и утилиты ----------
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
const DUMMY_HASH = users[0].passwordHash;
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
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
const refreshCookie = (token, maxAge) => `refresh=${token}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}${SECURE ? '; Secure' : ''}`;
const publicUser = (u) => ({ login: u.login, name: u.name, role: u.role });
// Дополнительная защита от CSRF для cookie-эндпоинтов: требуется нестандартный заголовок
const hasCsrfHeader = (req) => req.headers['x-requested-with'] === 'fetch';
const MESSAGES = {
  token_expired: 'Access token истёк', bad_signature: 'Недействительная подпись', bad_algorithm: 'Недопустимый алгоритм',
  malformed_token: 'Некорректный токен', bad_claims: 'Недопустимые claims токена', session_revoked: 'Сессия завершена', unauthorized: 'Требуется вход',
};

function authenticateBearer(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new AuthError('unauthorized');
  return verifyJwt(h.slice(7));
}

async function handleApi(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: 'bad_request', message: 'Некорректный запрос' }); }
    const login = typeof body.login === 'string' ? body.login.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!login || !password) return send(res, 400, { error: 'empty_fields', message: 'Введите логин и пароль' });
    const user = users.find((u) => u.login === login);
    const ok = verifyPassword(password, (user || { passwordHash: DUMMY_HASH }).passwordHash) && !!user;
    if (!ok) return send(res, 401, { error: 'invalid_credentials', message: 'Неверный логин или пароль' });

    const sid = crypto.randomUUID();
    families.set(sid, { login: user.login, revoked: false });
    return send(res, 200, { access_token: issueAccess(user, sid), expires_in: ACCESS_TTL_S, user: publicUser(user) },
      { 'Set-Cookie': refreshCookie(issueRefresh(sid), REFRESH_TTL_S) });
  }

  if (req.method === 'POST' && pathname === '/api/auth/refresh') {
    if (!hasCsrfHeader(req)) return send(res, 403, { error: 'csrf', message: 'Отсутствует заголовок X-Requested-With' });
    const token = parseCookies(req).refresh;
    if (!token) return send(res, 401, { error: 'unauthorized', message: 'Требуется вход' });
    const key = sha256(token);
    const rec = refreshTokens.get(key);
    const clear = { 'Set-Cookie': refreshCookie('', 0) };
    if (!rec) return send(res, 401, { error: 'invalid_refresh', message: 'Недействительный refresh token' }, clear);
    const fam = families.get(rec.sid);
    if (!fam || fam.revoked) return send(res, 401, { error: 'session_revoked', message: 'Сессия завершена' }, clear);
    if (rec.used) { // повторное предъявление уже использованного токена — вероятная кража
      fam.revoked = true;
      return send(res, 401, { error: 'refresh_reuse_detected', message: 'Обнаружено повторное использование токена, все сессии цепочки завершены' }, clear);
    }
    if (Date.now() > rec.expiresAt) { fam.revoked = true; return send(res, 401, { error: 'refresh_expired', message: 'Сессия истекла, войдите снова' }, clear); }
    rec.used = true; // ротация: старый токен больше не действует
    const user = users.find((u) => u.login === fam.login);
    return send(res, 200, { access_token: issueAccess(user, rec.sid), expires_in: ACCESS_TTL_S, user: publicUser(user) },
      { 'Set-Cookie': refreshCookie(issueRefresh(rec.sid), REFRESH_TTL_S) });
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    if (!hasCsrfHeader(req)) return send(res, 403, { error: 'csrf', message: 'Отсутствует заголовок X-Requested-With' });
    const token = parseCookies(req).refresh;
    const rec = token && refreshTokens.get(sha256(token));
    if (rec) { const fam = families.get(rec.sid); if (fam) fam.revoked = true; }
    return send(res, 200, { message: 'Вы вышли из системы' }, { 'Set-Cookie': refreshCookie('', 0) });
  }

  // ----- защищённые ресурсы: проверка JWT на сервере -----
  if (req.method === 'GET' && (pathname === '/api/profile' || pathname === '/api/admin/report')) {
    let claims;
    try { claims = authenticateBearer(req); }
    catch (e) { return send(res, 401, { error: e.code || 'unauthorized', message: MESSAGES[e.code] || 'Требуется вход' }, { 'WWW-Authenticate': 'Bearer' }); }
    const user = users.find((u) => u.login === claims.sub);
    if (!user) return send(res, 401, { error: 'unauthorized', message: 'Требуется вход' });
    if (pathname === '/api/profile') return send(res, 200, { user: publicUser(user), exp: claims.exp });
    if (claims.role !== 'admin' || user.role !== 'admin') return send(res, 403, { error: 'forbidden', message: 'Раздел доступен только администратору' });
    return send(res, 200, { report: { activeSessions: [...families.values()].filter((f) => !f.revoked).length, users: users.length } });
  }

  return send(res, 404, { error: 'not_found' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname.slice(1)));
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
