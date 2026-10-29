const BASE_URL = 'https://jsonplaceholder.typicode.com';

const loadBtn = document.querySelector('#load');
const retryBtn = document.querySelector('#retry');
const statusEl = document.querySelector('#status');
const summary = document.querySelector('#summary');
const results = document.querySelector('#results');

function setStatus(type, text) {
  statusEl.className = type;
  statusEl.textContent = text;
}

// Загружает один ресурс; в сообщении об ошибке указывает, какой именно
async function fetchJson(path, label) {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    const reason = error instanceof TypeError ? 'нет соединения с сервером' : error.message;
    throw new Error(`не удалось загрузить ${label} (${reason})`);
  }
}

function addChip(text) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = text;
  summary.append(chip);
}

async function loadData() {
  loadBtn.disabled = true;
  retryBtn.hidden = true;
  summary.replaceChildren();
  results.replaceChildren();
  setStatus('loading', 'Загрузка: два запроса выполняются параллельно...');

  const startedAt = performance.now();
  try {
    // Оба запроса стартуют одновременно; ждём, пока завершатся оба
    const [users, posts] = await Promise.all([
      fetchJson('/users', 'пользователей'),
      fetchJson('/posts', 'публикации'),
    ]);
    const elapsed = Math.round(performance.now() - startedAt);

    // Подсчёт публикаций по userId
    const counts = new Map();
    for (const post of posts) {
      counts.set(post.userId, (counts.get(post.userId) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());

    for (const user of users) {
      const count = counts.get(user.id) ?? 0;

      const item = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = count;

      const info = document.createElement('div');
      info.className = 'info';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = user.name;
      const email = document.createElement('div');
      email.className = 'email';
      email.textContent = `${user.email ?? 'нет данных'} · публикаций: ${count}`;
      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = `${(count / max) * 100}%`;
      bar.append(fill);

      info.append(name, email, bar);
      item.append(badge, info);
      results.append(item);
    }

    addChip(`Пользователей: ${users.length}`);
    addChip(`Публикаций: ${posts.length}`);
    addChip(`Время: ${elapsed} мс`);
    setStatus('success', 'Успех: данные загружены параллельно');
  } catch (error) {
    setStatus('error', `Ошибка: ${error.message}`);
    retryBtn.hidden = false;
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener('click', loadData);
retryBtn.addEventListener('click', loadData);
