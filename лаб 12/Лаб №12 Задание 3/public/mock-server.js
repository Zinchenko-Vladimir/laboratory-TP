// mock-server.js — ДЕМО-РЕЖИМ. Работает только при открытии страницы как файла (file://).
// Имитирует серверные маршруты прямо в браузере, чтобы прототип можно было открыть без запуска сервера.
// Это НЕ настоящая защита: код и данные находятся в браузере. Настоящая проверка — в server.js (start.bat).
(function () {
  'use strict';
  if (location.protocol !== 'file:') return; // при работе через сервер этот файл ничего не делает

  document.addEventListener('DOMContentLoaded', () => {
    const m = document.querySelector('main');
    if (!m) return;
    const b = document.createElement('div');
    b.style.cssText = 'background:#fff7e0;border:1px solid #f0d58a;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:13px';
    b.textContent = 'Демо-режим: работа сервера имитируется прямо в браузере, поэтому ничего запускать не нужно. Это учебный прототип; настоящая серверная проверка включается через start.bat.';
    m.prepend(b);
  });

  // ---------- SHA-256 (чистый JS, работает на file://) ----------
  const K = [], H0 = [];
  (function init() {
    let n = 2;
    while (K.length < 64) {
      let prime = true;
      for (let i = 2; i * i <= n; i++) if (n % i === 0) { prime = false; break; }
      if (prime) {
        if (H0.length < 8) H0.push((Math.sqrt(n) % 1) * 4294967296 | 0);
        K.push((Math.cbrt(n) % 1) * 4294967296 | 0);
      }
      n++;
    }
  })();
  function sha256bin(s) {
    const bitLen = s.length * 8;
    s += '\x80';
    while (s.length % 64 !== 56) s += '\x00';
    const w = [];
    for (let i = 0; i < s.length; i++) w[i >> 2] = (w[i >> 2] || 0) | (s.charCodeAt(i) << (24 - (i % 4) * 8));
    w.push(Math.floor(bitLen / 4294967296) | 0, bitLen | 0);
    const h = H0.slice();
    for (let j = 0; j < w.length; j += 16) {
      const x = w.slice(j, j + 16);
      for (let i = 16; i < 64; i++) {
        const a = x[i - 15], b = x[i - 2];
        const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
        const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        x[i] = (x[i - 16] + s0 + x[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + x[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    let out = '';
    for (const v of h) out += String.fromCharCode((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
    return out;
  }
  const utf8 = (s) => unescape(encodeURIComponent(s));
  const hex = (bin) => Array.from(bin, (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  function hashPassword(salt, pwd) { // соль + 2000 итераций (демо)
    let h = sha256bin(salt + utf8(pwd));
    for (let i = 0; i < 2000; i++) h = sha256bin(h + salt);
    return hex(h);
  }
  function hmac(key, msg) {
    if (key.length > 64) key = sha256bin(key);
    key += '\x00'.repeat(64 - key.length);
    const ip = Array.from(key, (c) => String.fromCharCode(c.charCodeAt(0) ^ 0x36)).join('');
    const op = Array.from(key, (c) => String.fromCharCode(c.charCodeAt(0) ^ 0x5c)).join('');
    return sha256bin(op + sha256bin(ip + msg));
  }
  const b64u = (bin) => btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

  // ---------- утилиты ----------
  window.__demo = { hashPassword, sha256hex: (s) => hex(sha256bin(s)) };
  function randId(n) {
    const a = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a, (v) => v.toString(16).padStart(2, '0')).join('');
  }
  const load = (k, d) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const save = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
  const del = (k) => { try { sessionStorage.removeItem(k); } catch { /* ignore */ } };
  const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  const publicUser = (u) => ({ login: u.login, name: u.name, role: u.role });
  function parse(input, options) {
    const url = new URL(String(input), 'http://demo.local');
    const headers = {};
    for (const [k, v] of Object.entries(options.headers || {})) headers[k.toLowerCase()] = v;
    let body = {}, badJson = false;
    if (options.body) { try { body = JSON.parse(options.body); } catch { badJson = true; } }
    return { method: (options.method || 'GET').toUpperCase(), path: url.pathname, headers, body, badJson };
  }
  const BAD = () => json(400, { error: 'bad_request', message: 'Некорректный запрос' });

  // ---------- вариант 17: JWT + ротация refresh token «в браузере» ----------
  // В демо refresh token лежит в sessionStorage (в настоящем сервере — cookie HttpOnly), секрет генерируется в браузере.
  const USERS = [
    { login: 'admin', name: 'Администратор Системы', role: 'admin', salt: 'e56a9ebcc84de60a', hash: 'c00ca2a018b884e23c3eef8006334f8660ac32bde602708eecd888e503008465' },
    { login: 'user1', name: 'Сидорова Мария', role: 'user', salt: 'c6515168f94b2906', hash: 'd4f00b15c8b42c47abc741de12e163cfc9272cec7b02d23dcab9065a8a9daa9e' },
  ];
  const ACCESS_TTL = 60, REFRESH_TTL = 7 * 24 * 3600, ISS = 'lab12-demo', AUD = 'lab12-client';
  const nowSec = () => Math.floor(Date.now() / 1000);
  const state = () => { let s = load('demo_c_state', null); if (!s) { s = { secret: randId(32), families: {}, refresh: {} }; save('demo_c_state', s); } return s; };
  const MESSAGES = { token_expired: 'Access token истёк', bad_signature: 'Недействительная подпись', bad_algorithm: 'Недопустимый алгоритм', malformed_token: 'Некорректный токен', bad_claims: 'Недопустимые claims токена', session_revoked: 'Сессия завершена', unauthorized: 'Требуется вход' };
  class AuthError extends Error { constructor(code) { super(code); this.code = code; } }

  function signJwt(payload, secret) {
    const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64u(JSON.stringify(payload));
    return head + '.' + body + '.' + b64u(hmac(secret, head + '.' + body));
  }
  function verifyJwt(token, s) {
    const parts = typeof token === 'string' ? token.split('.') : [];
    if (parts.length !== 3) throw new AuthError('malformed_token');
    let header, payload;
    try { header = JSON.parse(unb64u(parts[0])); payload = JSON.parse(unb64u(parts[1])); } catch { throw new AuthError('malformed_token'); }
    if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new AuthError('bad_algorithm');
    if (b64u(hmac(s.secret, parts[0] + '.' + parts[1])) !== parts[2]) throw new AuthError('bad_signature');
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec()) throw new AuthError('token_expired');
    if (payload.iss !== ISS || payload.aud !== AUD) throw new AuthError('bad_claims');
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') throw new AuthError('bad_claims');
    const fam = s.families[payload.sid];
    if (!fam || fam.revoked) throw new AuthError('session_revoked');
    return payload;
  }
  function issueAccess(user, sid, s) {
    const iat = nowSec();
    return signJwt({ iss: ISS, aud: AUD, sub: user.login, role: user.role, sid, jti: randId(8), iat, exp: iat + ACCESS_TTL }, s.secret);
  }
  function issueRefresh(sid, s) {
    const token = randId(48);
    s.refresh[hex(sha256bin(token))] = { sid, used: false, expiresAt: Date.now() + REFRESH_TTL * 1000 };
    save('demo_refresh', token);
    return token;
  }

  async function handle(req) {
    const { method, path, body, headers } = req;
    const s = state();

    if (method === 'POST' && path === '/api/auth/login') {
      if (req.badJson) return BAD();
      const login = typeof body.login === 'string' ? body.login.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!login || !password) return json(400, { error: 'empty_fields', message: 'Введите логин и пароль' });
      const user = USERS.find((u) => u.login === login);
      const ok = user && hashPassword(user.salt, password) === user.hash;
      if (!ok) return json(401, { error: 'invalid_credentials', message: 'Неверный логин или пароль' });
      const sid = randId(16);
      s.families[sid] = { login: user.login, revoked: false };
      const access = issueAccess(user, sid, s);
      issueRefresh(sid, s); save('demo_c_state', s);
      return json(200, { access_token: access, expires_in: ACCESS_TTL, user: publicUser(user) });
    }

    if (method === 'POST' && path === '/api/auth/refresh') {
      if (headers['x-requested-with'] !== 'fetch') return json(403, { error: 'csrf', message: 'Отсутствует заголовок X-Requested-With' });
      const token = load('demo_refresh', null);
      if (!token) return json(401, { error: 'unauthorized', message: 'Требуется вход' });
      const key = hex(sha256bin(token));
      const rec = s.refresh[key];
      if (!rec) { del('demo_refresh'); return json(401, { error: 'invalid_refresh', message: 'Недействительный refresh token' }); }
      const fam = s.families[rec.sid];
      if (!fam || fam.revoked) { del('demo_refresh'); return json(401, { error: 'session_revoked', message: 'Сессия завершена' }); }
      if (rec.used) { fam.revoked = true; save('demo_c_state', s); del('demo_refresh'); return json(401, { error: 'refresh_reuse_detected', message: 'Обнаружено повторное использование токена, все сессии цепочки завершены' }); }
      if (Date.now() > rec.expiresAt) { fam.revoked = true; save('demo_c_state', s); del('demo_refresh'); return json(401, { error: 'refresh_expired', message: 'Сессия истекла, войдите снова' }); }
      rec.used = true;
      const user = USERS.find((u) => u.login === fam.login);
      const access = issueAccess(user, rec.sid, s);
      issueRefresh(rec.sid, s); save('demo_c_state', s);
      return json(200, { access_token: access, expires_in: ACCESS_TTL, user: publicUser(user) });
    }

    if (method === 'POST' && path === '/api/auth/logout') {
      if (headers['x-requested-with'] !== 'fetch') return json(403, { error: 'csrf', message: 'Отсутствует заголовок X-Requested-With' });
      const token = load('demo_refresh', null);
      const rec = token && s.refresh[hex(sha256bin(token))];
      if (rec && s.families[rec.sid]) s.families[rec.sid].revoked = true;
      save('demo_c_state', s); del('demo_refresh');
      return json(200, { message: 'Вы вышли из системы' });
    }

    if (method === 'GET' && (path === '/api/profile' || path === '/api/admin/report')) {
      let claims;
      try {
        const h = headers.authorization || '';
        if (!h.startsWith('Bearer ')) throw new AuthError('unauthorized');
        claims = verifyJwt(h.slice(7), s);
      } catch (e) { return json(401, { error: e.code || 'unauthorized', message: MESSAGES[e.code] || 'Требуется вход' }); }
      const user = USERS.find((u) => u.login === claims.sub);
      if (!user) return json(401, { error: 'unauthorized', message: 'Требуется вход' });
      if (path === '/api/profile') return json(200, { user: publicUser(user), exp: claims.exp });
      if (claims.role !== 'admin' || user.role !== 'admin') return json(403, { error: 'forbidden', message: 'Раздел доступен только администратору' });
      return json(200, { report: { activeSessions: Object.values(s.families).filter((f) => !f.revoked).length, users: USERS.length } });
    }
    return json(404, { error: 'not_found' });
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, options = {}) => {
    const req = parse(input, options);
    if (!req.path.startsWith('/api/')) return realFetch(input, options);
    return handle(req);
  };
})();
