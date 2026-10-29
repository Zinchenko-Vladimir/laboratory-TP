const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

const usersEl = document.querySelector('#users');
const retryBtn = document.querySelector('#retry');
const statusEl = document.querySelector('#status');

function setStatus(type, text) {
  statusEl.className = type;
  statusEl.textContent = text;
}

function networkMessage(error) {
  return error instanceof TypeError ? 'Нет соединения с сервером' : error.message;
}

function createCard(user) {
  const card = document.createElement('article');
  card.className = 'user-card';

  const name = document.createElement('h3');
  name.textContent = user.name;
  const email = document.createElement('p');
  email.className = 'meta';
  email.textContent = `✉ ${user.email ?? 'нет данных'}`;
  const place = document.createElement('p');
  place.className = 'meta';
  place.textContent = `${user.address?.city ?? 'город не указан'} · ${user.company?.name ?? 'компания не указана'}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Показать публикации';
  const cardStatus = document.createElement('p');
  cardStatus.className = 'card-status';
  const list = document.createElement('ul');
  list.className = 'post-list';
  list.hidden = true;

  let loaded = false;
  let busy = false;

  button.addEventListener('click', async () => {
    if (busy) return;

    // Уже загружено — просто показываем или скрываем список
    if (loaded) {
      list.hidden = !list.hidden;
      button.textContent = list.hidden ? 'Показать публикации' : 'Скрыть публикации';
      return;
    }

    busy = true;
    button.disabled = true;
    cardStatus.className = 'card-status loading';
    cardStatus.textContent = 'Загрузка...';

    try {
      const response = await fetch(`${POSTS_URL}?userId=${user.id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const posts = await response.json();

      list.replaceChildren();
      for (const post of posts) {
        const item = document.createElement('li');
        item.textContent = post.title;
        list.append(item);
      }
      loaded = true;
      list.hidden = false;
      button.textContent = 'Скрыть публикации';
      cardStatus.className = 'card-status success';
      cardStatus.textContent = `Успех: загружено публикаций — ${posts.length}`;
    } catch (error) {
      cardStatus.className = 'card-status error';
      cardStatus.textContent = `Ошибка: ${networkMessage(error)}`;
      button.textContent = 'Повторить';
    } finally {
      busy = false;
      button.disabled = false;
    }
  });

  card.append(name, email, place, button, cardStatus, list);
  return card;
}

async function loadUsers() {
  retryBtn.hidden = true;
  usersEl.replaceChildren();
  setStatus('loading', 'Загрузка пользователей...');

  try {
    const response = await fetch(USERS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const users = await response.json();

    for (const user of users) usersEl.append(createCard(user));
    setStatus('success', `Успех: загружено пользователей — ${users.length}`);
  } catch (error) {
    setStatus('error', `Ошибка загрузки: ${networkMessage(error)}`);
    retryBtn.hidden = false;
  }
}

retryBtn.addEventListener('click', loadUsers);
loadUsers();
