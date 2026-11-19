'use strict';
// Автотесты 8 обязательных сценариев + проверки прав администратора. Запуск: node test.js
const fs = require('fs');
process.env.SESSION_TTL_MS = '1500';
const server = require('./server');

const results = [];
const record = (n, name, input, expected, actual, pass) => {
  results.push({ n, name, input, expected, actual, pass });
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${n}. ${name} -> ${actual}`);
};
const cookieOf = (res) => (res.headers.getSetCookie()[0] || '').split(';')[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

server.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  const req = (method, p, { cookie, body } = {}) => fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: body ? JSON.stringify(body) : undefined });
  const login = async (l, p) => { const r = await req('POST', '/api/login', { body: { login: l, password: p } }); return { r, cookie: cookieOf(r) }; };

  // 1
  let { r, cookie: adminCookie } = await login('admin', 'Admin#2026');
  let j = await r.json();
  record(1, 'Корректный вход', 'admin / верный пароль', '200, роль admin, cookie выдана', `${r.status}, ${j.user?.role}`, r.status === 200 && j.user.role === 'admin' && !!adminCookie);
  // 2
  ({ r } = await login('admin', 'wrong'));
  record(2, 'Неверный пароль', 'admin / wrong', '401', String(r.status), r.status === 401);
  // 3
  r = await req('POST', '/api/login', { body: { login: '', password: '' } });
  record(3, 'Пустые поля', 'login="", password=""', '400', String(r.status), r.status === 400);
  // 4
  const r4a = await req('GET', '/api/admin/users');
  const r4b = await req('GET', '/admin');
  record(4, 'Доступ без входа', 'GET /api/admin/users и GET /admin без cookie', '401 и 401', `${r4a.status} и ${r4b.status}`, r4a.status === 401 && r4b.status === 401);
  // 8
  r = await req('GET', '/api/profile', { cookie: adminCookie }); j = await r.json();
  record(8, 'Обновление страницы после входа', 'GET /api/profile с cookie', '200, профиль сохраняется', `${r.status}, ${j.user?.login}`, r.status === 200 && j.user.login === 'admin');
  // 7
  const { cookie: userCookie } = await login('user1', 'User#2026');
  const a = await req('GET', '/api/admin/users', { cookie: userCookie });
  const b = await req('GET', '/admin', { cookie: userCookie });
  const c = await req('POST', '/api/admin/users/user2/block', { cookie: userCookie, body: { blocked: true } });
  const d = await req('GET', '/api/admin/users', { cookie: adminCookie });
  record(7, 'Доступ к чужому (админскому) ресурсу', 'user1 -> /api/admin/users, /admin, POST block', '403, 403, 403 (у admin — 200)', `${a.status}, ${b.status}, ${c.status} (admin: ${d.status})`, [a, b, c].every((x) => x.status === 403) && d.status === 200);
  // доп.: страница админки для администратора
  r = await req('GET', '/admin', { cookie: adminCookie });
  const html = await r.text();
  record('7а', 'Админ открывает /admin', 'admin -> GET /admin', '200, страница админки', `${r.status}, содержит заголовок=${html.includes('Панель администратора')}`, r.status === 200 && html.includes('Панель администратора'));
  // доп.: блокировка
  r = await req('POST', '/api/admin/users/user1/block', { cookie: adminCookie, body: { blocked: true } });
  const sessAfter = await req('GET', '/api/profile', { cookie: userCookie });
  const reLogin = await login('user1', 'User#2026');
  record('7б', 'Блокировка пользователя', 'admin блокирует user1', '200; сессия user1 закрыта (401); повторный вход 403', `${r.status}; ${sessAfter.status}; ${reLogin.r.status}`, r.status === 200 && sessAfter.status === 401 && reLogin.r.status === 403);
  // 5
  r = await req('POST', '/api/logout', { cookie: adminCookie });
  const after = await req('GET', '/api/admin/users', { cookie: adminCookie });
  record(5, 'Выход и повторный запрос', 'POST /api/logout, затем GET /api/admin/users', '200, затем 401', `${r.status}, затем ${after.status}`, r.status === 200 && after.status === 401);
  // 6
  const { cookie: shortCookie } = await login('admin', 'Admin#2026');
  await sleep(1800);
  r = await req('GET', '/api/profile', { cookie: shortCookie }); j = await r.json();
  record(6, 'Истекшая сессия', 'бездействие 1.8 c при тайм-ауте 1.5 c', '401, session_expired', `${r.status}, ${j.error}`, r.status === 401 && j.error === 'session_expired');

  const order = (n) => (typeof n === 'number' ? n : parseInt(n, 10) + 0.5);
  results.sort((x, y) => order(x.n) - order(y.n));
  const md = ['| № | Сценарий | Входные условия | Ожидаемый результат | Фактический результат | Статус |', '|---|---|---|---|---|---|',
    ...results.map((x) => `| ${x.n} | ${x.name} | ${x.input} | ${x.expected} | ${x.actual} | ${x.pass ? 'Пройден' : 'Не пройден'} |`)].join('\n');
  fs.writeFileSync(__dirname + '/TEST_RESULTS.md', md + '\n');
  const failed = results.filter((x) => !x.pass).length;
  console.log(failed ? `\nНе пройдено: ${failed}` : '\nВсе сценарии пройдены. Таблица записана в TEST_RESULTS.md');
  server.close(); process.exit(failed ? 1 : 0);
});
