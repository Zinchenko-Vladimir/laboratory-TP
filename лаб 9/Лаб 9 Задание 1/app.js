const API_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=10';

const loadBtn = document.querySelector('#load');
const retryBtn = document.querySelector('#retry');
const statusEl = document.querySelector('#status');
const results = document.querySelector('#results');

function setStatus(type, text) {
  statusEl.className = type;
  statusEl.textContent = text;
}

async function loadTodos() {
  loadBtn.disabled = true;
  retryBtn.hidden = true;
  results.replaceChildren();
  setStatus('loading', 'Загрузка...');

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const todos = await response.json();

    let doneCount = 0;
    for (const todo of todos) {
      const item = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = todo.id;
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = todo.title;
      const tag = document.createElement('span');
      tag.className = 'tag';

      if (todo.completed) {
        item.classList.add('done');
        tag.classList.add('ok');
        tag.textContent = '✓ выполнена';
        doneCount += 1;
      } else {
        tag.textContent = 'в работе';
      }
      item.append(badge, title, tag);
      results.append(item);
    }
    setStatus('success', `Успех: загружено ${todos.length}, выполнено ${doneCount}`);
  } catch (error) {
    const message = error instanceof TypeError
      ? 'Нет соединения с сервером'
      : error.message;
    setStatus('error', `Ошибка загрузки: ${message}`);
    retryBtn.hidden = false;
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener('click', loadTodos);
retryBtn.addEventListener('click', loadTodos);
