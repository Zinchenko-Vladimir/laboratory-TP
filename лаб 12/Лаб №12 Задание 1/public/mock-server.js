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

  // ---------- вариант 4: сессия «в браузере» ----------
  const USERS = [
    { login: 'teacher1', name: 'Иванова Анна Петровна', role: 'teacher', salt: '8dbeb7b4f3dc3b3b', hash: '92a05a0be5ff1d53e9e9c1396a384df2a1c742429bf1533ddb226d39fe73fbdc' },
    { login: 'student1', name: 'Петров Пётр Сергеевич', role: 'student', salt: 'bbd7ce01bfea75ff', hash: 'e449c03d6c89bdb0a0e1d373324adabff73e8b8ff3a4bb74a303e45cd3d4f088' },
  ];
  const TTL = 15 * 60 * 1000;
  function authenticate() {
    const sid = load('demo_sid', null);
    if (!sid) return { error: 'unauthorized' };
    const sessions = load('demo_sessions', {});
    const s = sessions[sid];
    if (!s) return { error: 'session_expired' };
    if (Date.now() > s.expiresAt) { delete sessions[sid]; save('demo_sessions', sessions); return { error: 'session_expired' }; }
    const user = USERS.find((u) => u.login === s.login);
    return user ? { user, sid } : { error: 'unauthorized' };
  }
  const msg = (e) => (e === 'session_expired' ? 'Сессия истекла, войдите снова' : 'Требуется вход');

  async function handle(req) {
    const { method, path, body } = req;
    if (method === 'POST' && path === '/api/login') {
      if (req.badJson) return BAD();
      const login = typeof body.login === 'string' ? body.login.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!login || !password) return json(400, { error: 'empty_fields', message: 'Введите логин и пароль' });
      const user = USERS.find((u) => u.login === login);
      const ok = user && hashPassword(user.salt, password) === user.hash;
      if (!ok) return json(401, { error: 'invalid_credentials', message: 'Неверный логин или пароль' });
      const sid = randId(32);
      const sessions = load('demo_sessions', {});
      sessions[sid] = { login: user.login, expiresAt: Date.now() + TTL };
      save('demo_sessions', sessions); save('demo_sid', sid);
      return json(200, { user: publicUser(user) });
    }
    if (method === 'GET' && path === '/api/profile') {
      const a = authenticate();
      if (!a.user) return json(401, { error: a.error, message: msg(a.error) });
      return json(200, { user: publicUser(a.user) });
    }
    if (method === 'GET' && path === '/api/teacher/groups') {
      const a = authenticate();
      if (!a.user) return json(401, { error: a.error, message: msg(a.error) });
      if (a.user.role !== 'teacher') return json(403, { error: 'forbidden', message: 'Раздел доступен только преподавателю' });
      return json(200, { groups: ['ИС-25-21', 'ИС-25-22', 'ПО-25-11'] });
    }
    if (method === 'POST' && path === '/api/logout') {
      const sid = load('demo_sid', null);
      if (sid) { const sessions = load('demo_sessions', {}); delete sessions[sid]; save('demo_sessions', sessions); }
      del('demo_sid');
      return json(200, { message: 'Вы вышли из системы' });
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
