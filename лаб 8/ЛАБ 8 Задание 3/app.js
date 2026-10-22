const KEY = "lab8_kanban";
const STATUSES = [
  { id: "plan", title: "План" },
  { id: "progress", title: "В работе" },
  { id: "done", title: "Готово" }
];
const form = document.getElementById("form");
const titleEl = document.getElementById("title");
const errorEl = document.getElementById("error");
const boardEl = document.getElementById("board");

function isValidCard(c) {
  return c && typeof c.id === "number" && typeof c.title === "string" &&
         STATUSES.some(s => s.id === c.status);
}

// Структура в хранилище: { version: 1, cards: [ {id, title, status} ] }
function loadState() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return { version: 1, cards: [] };
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.cards)) throw new Error("неверная структура");
    return { version: 1, cards: data.cards.filter(isValidCard) };
  } catch (e) {
    console.warn("Повреждённый JSON, доска сброшена:", e.message);
    localStorage.removeItem(KEY);
    showError("Сохранённые данные были повреждены, доска очищена.");
    return { version: 1, cards: [] };
  }
}

function saveState() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { showError("Не удалось сохранить данные."); }
}

function showError(t) { errorEl.textContent = t; }

function moveCard(id, status) {
  const card = state.cards.find(c => c.id === id);
  if (!card || card.status === status) return;
  card.status = status;
  saveState();
  render();
}

function shift(card, delta) {
  const i = STATUSES.findIndex(s => s.id === card.status) + delta;
  if (i >= 0 && i < STATUSES.length) moveCard(card.id, STATUSES[i].id);
}

function editCard(card) {
  const text = prompt("Новый текст задачи:", card.title);
  if (text === null) return;
  const t = text.trim();
  if (!t) { showError("Название задачи не может быть пустым."); return; }
  showError("");
  card.title = t;
  saveState();
  render();
}

function makeButton(label, title, handler, cls) {
  const b = document.createElement("button");
  b.textContent = label;
  b.title = title;
  if (cls) b.className = cls;
  b.onclick = handler;
  return b;
}

function render() {
  boardEl.innerHTML = "";
  STATUSES.forEach(status => {
    const col = document.createElement("div");
    col.className = "col";
    const cards = state.cards.filter(c => c.status === status.id);
    const h = document.createElement("h2");
    h.textContent = status.title + " (" + cards.length + ")";
    col.append(h);
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("over"); });
    col.addEventListener("dragleave", () => col.classList.remove("over"));
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("over");
      moveCard(Number(e.dataTransfer.getData("text/plain")), status.id);
    });
    cards.forEach(card => {
      const el = document.createElement("div");
      el.className = "card";
      el.draggable = true;
      el.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(card.id));
        el.classList.add("dragging");
      });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
      const p = document.createElement("p");
      p.textContent = card.title;
      p.ondblclick = () => editCard(card);
      const tools = document.createElement("div");
      tools.className = "tools";
      tools.append(
        makeButton("◀", "Влево", () => shift(card, -1)),
        makeButton("▶", "Вправо", () => shift(card, 1)),
        makeButton("✎", "Изменить", () => editCard(card)),
        makeButton("✕", "Удалить", () => {
          state.cards = state.cards.filter(c => c.id !== card.id);
          saveState();
          render();
        }, "danger")
      );
      el.append(p, tools);
      col.append(el);
    });
    boardEl.append(col);
  });
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const title = titleEl.value.trim();
  if (!title) { showError("Введите название задачи."); return; }
  showError("");
  state.cards.push({ id: Date.now() + Math.floor(Math.random() * 1000), title, status: "plan" });
  saveState();
  titleEl.value = "";
  render();
});

let state = loadState();
render();
