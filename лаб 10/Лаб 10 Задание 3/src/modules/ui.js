// Отображение доски: только DOM. Пользовательский текст — через textContent
import { COLUMNS, neighborStatus } from "./columns.js";
import { tasksByStatus } from "./tasks.js";

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

export function renderBoard(container, tasks) {
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

export function showMessage(el, text) {
  el.textContent = text;
}
