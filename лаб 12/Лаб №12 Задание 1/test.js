'use strict';
// Автотесты 8 обязательных сценариев. Запуск: node test.js
const fs = require('fs');
process.env.SESSION_TTL_MS = '1500'; // короткая сессия для сценария «истекшая сессия»
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
  const post = (p, body, cookie) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body || {}) });
  const get = (p, cookie) => fetch(base + p, { headers: cookie ? { Cookie: cookie } : {} });

  // 1. Корректный вход
  let r = await post('/api/login', { login: 'teacher1', password: 'Teacher#2026' });
  const flags = r.headers.getSetCookie()[0] || '';
  const cookie = cookieOf(r);
  let j = await r.json();
  record(1, 'Корректный вход', 'teacher1 / верный пароль', '200, имя и роль, cookie HttpOnly', `${r.status}, ${j.user?.name}, ${j.user?.role}, HttpOnly=${/HttpOnly/.test(flags)}`, r.status === 200 && j.user.role === 'teacher' && /HttpOnly/.test(flags));

  // 2. Неверный пароль
  r = await post('/api/login', { login: 'teacher1', password: 'wrong' });
  record(2, 'Неверный пароль', 'teacher1 / wrong', '401, cookie не выдана', `${r.status}, cookie=${cookieOf(r) || 'нет'}`, r.status === 401 && !cookieOf(r));

  // 3. Пустые поля
  r = await post('/api/login', { login: '', password: '' });
  record(3, 'Пустые поля', 'login="", password=""', '400', String(r.status), r.status === 400);

  // 4. Доступ без входа
  r = await get('/api/profile');
  record(4, 'Доступ без входа', 'GET /api/profile без cookie', '401', String(r.status), r.status === 401);

  // 8. Обновление страницы (повторный запрос с той же cookie)
  r = await get('/api/profile', cookie);
  j = await r.json();
  record(8, 'Обновление страницы после входа', 'GET /api/profile с cookie', '200, профиль сохраняется', `${r.status}, ${j.user?.login}`, r.status === 200 && j.user.login === 'teacher1');

  // 7. Чужой ресурс (студент -> раздел преподавателя)
  const sr = await post('/api/login', { login: 'student1', password: 'Student#2026' });
  const studentCookie = cookieOf(sr);
  r = await get('/api/teacher/groups', studentCookie);
  const okTeacher = await get('/api/teacher/groups', cookie);
  record(7, 'Доступ к чужому ресурсу', 'student1 -> GET /api/teacher/groups', '403 (у преподавателя — 200)', `${r.status} (преподаватель: ${okTeacher.status})`, r.status === 403 && okTeacher.status === 200);

  // 5. Выход и повторный запрос
  r = await post('/api/logout', {}, cookie);
  const after = await get('/api/profile', cookie);
  record(5, 'Выход и повторный запрос', 'POST /api/logout, затем GET /api/profile со старой cookie', '200, затем 401', `${r.status}, затем ${after.status}`, r.status === 200 && after.status === 401);

  // 6. Истекшая сессия
  r = await post('/api/login', { login: 'teacher1', password: 'Teacher#2026' });
  const shortCookie = cookieOf(r);
  await sleep(1800);
  r = await get('/api/profile', shortCookie);
  j = await r.json();
  record(6, 'Истекшая сессия', 'ожидание 1.8 c при TTL 1.5 c', '401, session_expired', `${r.status}, ${j.error}`, r.status === 401 && j.error === 'session_expired');

  results.sort((a, b) => a.n - b.n);
  const md = ['| № | Сценарий | Входные условия | Ожидаемый результат | Фактический результат | Статус |', '|---|---|---|---|---|---|',
    ...results.map((x) => `| ${x.n} | ${x.name} | ${x.input} | ${x.expected} | ${x.actual} | ${x.pass ? 'Пройден' : 'Не пройден'} |`)].join('\n');
  fs.writeFileSync(__dirname + '/TEST_RESULTS.md', md + '\n');
  const failed = results.filter((x) => !x.pass).length;
  console.log(failed ? `\nНе пройдено: ${failed}` : '\nВсе сценарии пройдены. Таблица записана в TEST_RESULTS.md');
  server.close();
  process.exit(failed ? 1 : 0);
});
