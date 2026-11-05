(function () {
// ===== columns.js =====
// Описание колонок и допустимых переходов между статусами
const COLUMNS = [
  { id: "todo", title: "К выполнению" },
  { id: "doing", title: "В работе" },
  { id: "done", title: "Готово" }
];

const order = COLUMNS.map(c => c.id);

function isValidStatus(status) {
  return order.includes(status);
}

// direction: -1 (влево) или +1 (вправо); null, если перехода нет
function neighborStatus(status, direction) {
  const next = order[order.indexOf(status) + direction];
  return next ?? null;
}

// ===== tasks.js =====
// Логика задач: чистые функции, без DOM и без хранилища

function createTask(title) {
  const clean = String(title).trim();
  if (clean === "") throw new Error("Название задачи не может быть пустым");
  if (clean.length < 3) throw new Error("Название должно содержать минимум 3 символа");
  if (clean.length > 80) throw new Error("Название не должно превышать 80 символов");
  return { id: Date.now() + Math.floor(Math.random() * 1000), title: clean, status: "todo" };
}

function addTask(tasks, task) {
  const duplicate = tasks.some(t => t.title.toLowerCase() === task.title.toLowerCase() && t.status === task.status);
  if (duplicate) throw new Error("Такая задача уже есть в этой колонке");
  return [...tasks, task];
}

function moveTask(tasks, id, direction) {
  return tasks.map(t => {
    if (t.id !== id) return t;
    const status = neighborStatus(t.status, direction);
    return status ? { ...t, status } : t;
  });
}

function removeTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

function tasksByStatus(tasks, status) {
  return tasks.filter(t => t.status === status);
}

// ===== storage.js =====
// Хранение: localStorage + защита от испорченных данных

const KEY = "lab10_kanban_tasks";

function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(t => t && typeof t.title === "string" && isValidStatus(t.status));
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

// ===== ui.js =====
// Отображение доски: только DOM. Пользовательский текст — через textContent


function createButton(text, action, id, { danger = false, disabled = false } = {}) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.dataset.action = action;
  btn.dataset.id = id;
  btn.disabled = disabled;
  if (danger) btn.className = "danger";
  return btn;
}

function createCard(task) {
  const card = document.createElement("div");
  card.className = "card";
  const title = document.createElement("p");
  title.textContent = task.title;
  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(
    createButton("←", "left", task.id, { disabled: !neighborStatus(task.status, -1) }),
    createButton("→", "right", task.id, { disabled: !neighborStatus(task.status, 1) }),
    createButton("✕", "delete", task.id, { danger: true })
  );
  card.append(title, actions);
  return card;
}

function renderBoard(container, tasks) {
  container.innerHTML = "";
  for (const col of COLUMNS) {
    const list = tasksByStatus(tasks, col.id);
    const section = document.createElement("section");
    section.className = "column";
    const h = document.createElement("h2");
    h.textContent = `${col.title} (${list.length})`;
    section.append(h, ...list.map(createCard));
    container.append(section);
  }
}

function showMessage(el, text) {
  el.textContent = text;
}

// ===== main.js =====



const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const board = document.querySelector("#board");
const messageEl = document.querySelector("#message");

let tasks = loadTasks();

function update(newTasks) {
  tasks = newTasks;
  saveTasks(tasks);
  renderBoard(board, tasks);
}

renderBoard(board, tasks);

form.addEventListener("submit", e => {
  e.preventDefault();
  try {
    update(addTask(tasks, createTask(titleInput.value)));
    showMessage(messageEl, "");
    titleInput.value = "";
  } catch (err) {
    showMessage(messageEl, err.message);
  }
  titleInput.focus();
});

board.addEventListener("click", e => {
  const { action, id } = e.target.dataset;
  if (!action) return;
  const taskId = Number(id);
  if (action === "left") update(moveTask(tasks, taskId, -1));
  if (action === "right") update(moveTask(tasks, taskId, 1));
  if (action === "delete") update(removeTask(tasks, taskId));
});

document.querySelector("#clear").addEventListener("click", () => {
  if (tasks.length && confirm("Удалить все задачи?")) update([]);
});

})();
