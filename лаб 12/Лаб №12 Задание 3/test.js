'use strict';
// Автотесты 8 обязательных сценариев + проверки JWT и ротации refresh token. Запуск: node test.js
const fs = require('fs');
const crypto = require('crypto');
process.env.ACCESS_TTL_S = '2'; // короткий access token для сценария «истёк»
const server = require('./server');

const results = [];
const record = (n, name, input, expected, actual, pass) => {
  results.push({ n, name, input, expected, actual, pass });
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${n}. ${name} -> ${actual}`);
};
const refreshOf = (res) => (res.headers.getSetCookie()[0] || '').split(';')[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

server.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  const call = (method, p, { cookie, token, body, csrf } = {}) => fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }), ...(token && { Authorization: `Bearer ${token}` }), ...(csrf && { 'X-Requested-With': 'fetch' }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const login = async (l, p) => { const r = await call('POST', '/api/auth/login', { body: { login: l, password: p } }); const j = await r.json(); return { r, j, cookie: refreshOf(r) }; };

  // 1
  const u = await login('user1', 'User#2026');
  const setCookie = u.r.headers.getSetCookie()[0] || '';
  record(1, 'Корректный вход', 'user1 / верный пароль', '200, access_token (3 части), refresh cookie HttpOnly', `${u.r.status}, частей=${(u.j.access_token || '').split('.').length}, HttpOnly=${/HttpOnly/.test(setCookie)}`, u.r.status === 200 && u.j.access_token.split('.').length === 3 && /HttpOnly/.test(setCookie));
  // 2
  let w = await login('user1', 'wrong');
  record(2, 'Неверный пароль', 'user1 / wrong', '401, токены не выданы', `${w.r.status}, access_token=${w.j.access_token ? 'есть' : 'нет'}`, w.r.status === 401 && !w.j.access_token);
  // 3
  let r = await call('POST', '/api/auth/login', { body: { login: '', password: '' } });
  record(3, 'Пустые поля', 'login="", password=""', '400', String(r.status), r.status === 400);
  // 4
  const r4a = await call('GET', '/api/profile');
  const r4b = await call('GET', '/api/profile', { token: 'abc.def.ghi' });
  record(4, 'Доступ без входа', 'GET /api/profile без токена; с мусорным токеном', '401 и 401', `${r4a.status} и ${r4b.status}`, r4a.status === 401 && r4b.status === 401);
  // 8 (обновление страницы: access пропал, refresh cookie жива)
  r = await call('POST', '/api/auth/refresh', { cookie: u.cookie, csrf: true });
  let j = await r.json();
  const rotatedCookie = refreshOf(r);
  const prof = await call('GET', '/api/profile', { token: j.access_token });
  record(8, 'Обновление страницы после входа', 'POST /api/auth/refresh с refresh cookie, затем GET /api/profile', '200 (новый access), 200; refresh cookie заменён', `${r.status}, ${prof.status}, cookie заменён=${rotatedCookie !== u.cookie}`, r.status === 200 && prof.status === 200 && rotatedCookie && rotatedCookie !== u.cookie);
  // 7
  const a = await call('GET', '/api/admin/report', { token: j.access_token });
  const adm = await login('admin', 'Admin#2026');
  const b = await call('GET', '/api/admin/report', { token: adm.j.access_token });
  record(7, 'Доступ к чужому (админскому) ресурсу', 'user1 -> GET /api/admin/report', '403 (у admin — 200)', `${a.status} (admin: ${b.status})`, a.status === 403 && b.status === 200);
  // 9. Подмена payload (role=admin) без пересчёта подписи
  const [h, p, s] = j.access_token.split('.');
  const forged = JSON.parse(Buffer.from(p, 'base64url')); forged.role = 'admin';
  const tampered = `${h}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${s}`;
  r = await call('GET', '/api/admin/report', { token: tampered });
  record(9, 'JWT с подменённым payload', 'role=user заменён на admin, подпись прежняя', '401 bad_signature', `${r.status}, ${(await r.json()).error}`, r.status === 401);
  // 10. alg=none
  const noneH = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  r = await call('GET', '/api/admin/report', { token: `${noneH}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.` });
  record(10, 'JWT с alg=none', 'заголовок alg=none, подписи нет', '401 bad_algorithm', `${r.status}, ${(await r.json()).error}`, r.status === 401);
  // 11. Токен, подписанный чужим ключом
  const fh = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const fp = Buffer.from(JSON.stringify({ ...forged, iss: 'lab12-demo', aud: 'lab12-client', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
  const fs2 = crypto.createHmac('sha256', 'wrong-secret').update(`${fh}.${fp}`).digest('base64url');
  r = await call('GET', '/api/admin/report', { token: `${fh}.${fp}.${fs2}` });
  record(11, 'JWT с чужой подписью', 'подпись другим секретом', '401 bad_signature', `${r.status}, ${(await r.json()).error}`, r.status === 401);
  // 12. Нет CSRF-заголовка
  r = await call('POST', '/api/auth/refresh', { cookie: rotatedCookie });
  record(12, 'Refresh без X-Requested-With', 'POST /api/auth/refresh без заголовка', '403', String(r.status), r.status === 403);
  // 13. Ротация и обнаружение повторного использования
  const old = u.cookie;                // уже использован в сценарии 8
  const fresh = rotatedCookie;         // действующий токен семейства
  r = await call('POST', '/api/auth/refresh', { cookie: old, csrf: true });
  const reuse = (await r.json()).error;
  const after = await call('POST', '/api/auth/refresh', { cookie: fresh, csrf: true });
  record(13, 'Повторное использование refresh token', 'старый (уже обменянный) refresh -> затем актуальный refresh той же цепочки', '401 refresh_reuse_detected; затем 401 (цепочка отозвана)', `${r.status} ${reuse}; затем ${after.status}`, r.status === 401 && reuse === 'refresh_reuse_detected' && after.status === 401);
  // 5. Выход и повторный запрос
  const s2 = await login('user1', 'User#2026');
  const outR = await call('POST', '/api/auth/logout', { cookie: s2.cookie, csrf: true });
  const afterAccess = await call('GET', '/api/profile', { token: s2.j.access_token });
  const afterRefresh = await call('POST', '/api/auth/refresh', { cookie: s2.cookie, csrf: true });
  record(5, 'Выход и повторный запрос', 'logout; затем GET /api/profile со старым access и refresh со старым cookie', '200; 401; 401', `${outR.status}; ${afterAccess.status}; ${afterRefresh.status}`, outR.status === 200 && afterAccess.status === 401 && afterRefresh.status === 401);
  // 6. Истекший access token
  const s3 = await login('user1', 'User#2026');
  await sleep(2300);
  r = await call('GET', '/api/profile', { token: s3.j.access_token });
  const expiredErr = (await r.json()).error;
  const renew = await call('POST', '/api/auth/refresh', { cookie: s3.cookie, csrf: true });
  const renewed = await renew.json();
  const again = await call('GET', '/api/profile', { token: renewed.access_token });
  record(6, 'Истекшая сессия (access token)', 'ожидание 2.3 c при TTL access 2 c; затем refresh', '401 token_expired; refresh 200; повтор запроса 200', `${r.status} ${expiredErr}; ${renew.status}; ${again.status}`, r.status === 401 && expiredErr === 'token_expired' && renew.status === 200 && again.status === 200);

  const order = (x) => x.n;
  results.sort((x, y) => order(x) - order(y));
  const md = ['| № | Сценарий | Входные условия | Ожидаемый результат | Фактический результат | Статус |', '|---|---|---|---|---|---|',
    ...results.map((x) => `| ${x.n} | ${x.name} | ${x.input} | ${x.expected} | ${x.actual} | ${x.pass ? 'Пройден' : 'Не пройден'} |`)].join('\n');
  fs.writeFileSync(__dirname + '/TEST_RESULTS.md', md + '\n');
  const failed = results.filter((x) => !x.pass).length;
  console.log(failed ? `\nНе пройдено: ${failed}` : '\nВсе сценарии пройдены. Таблица записана в TEST_RESULTS.md');
  server.close(); process.exit(failed ? 1 : 0);
});
