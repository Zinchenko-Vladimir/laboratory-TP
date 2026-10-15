"use strict";

const STORE_KEY = "lab7-tasks";
const EMPTY = { all: "Задач пока нет. Добавьте первую.", active: "Нет активных задач.", done: "Выполненных задач пока нет." };

let tasks = loadTasks();   // массив объектов {id, text, done}
let currentTab = "all";

/* ===== Данные ===== */
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (e) { /* хранилище недоступно */ }
  return [
    { id: 1, text: "Сдать лабораторную по JavaScript", done: false },
    { id: 2, text: "Подготовить презентацию к СРО", done: false },
    { id: 3, text: "Купить учебник по алгоритмам", done: true }
  ];
}
function saveTasks() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); } catch (e) { /* ничего */ }
}

function filterTasks(list, tab) {
  if (tab === "active") return list.filter(t => !t.done);
  if (tab === "done") return list.filter(t => t.done);
  return list;
}

// Проверка ввода: возвращает текст ошибки или пустую строку
function validateText(text) {
  const t = text.trim();
  if (t === "") return "Введите название задачи.";
  if (t.length < 3) return "Название слишком короткое: минимум 3 символа.";
  if (t.length > 100) return "Название слишком длинное: максимум 100 символов.";
  return "";
}
function nextId() { return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1; }

/* ===== Интерфейс ===== */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildItem(task) {
  const li = el("li", "item" + (task.done ? " done" : ""));
  const box = el("input");
  box.type = "checkbox";
  box.id = "task-" + task.id;
  box.checked = task.done;
  box.addEventListener("change", () => toggleTask(task.id));

  const label = el("label", "", task.text);
  label.htmlFor = box.id;

  const del = el("button", "del", "Удалить");
  del.type = "button";
  del.setAttribute("aria-label", "Удалить задачу: " + task.text);
  del.addEventListener("click", () => removeTask(task.id));

  li.append(box, label, del);
  return li;
}

function render() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === currentTab);
  });
  ["all", "active", "done"].forEach(name => {
    document.getElementById("count-" + name).textContent = filterTasks(tasks, name).length;
  });
  const list = document.getElementById("list");
  list.replaceChildren();
  const visible = filterTasks(tasks, currentTab);
  if (visible.length === 0) {
    list.append(el("li", "empty", EMPTY[currentTab]));
    return;
  }
  visible.forEach(t => list.append(buildItem(t)));
}

/* ===== Действия ===== */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;      // смена статуса
  saveTasks();
  render();
}
function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

document.getElementById("add-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const error = validateText(input.value);
  document.getElementById("error").textContent = error;
  if (error) { input.focus(); return; }
  tasks.push({ id: nextId(), text: input.value.trim(), done: false });
  input.value = "";
  saveTasks();
  render();
});

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => { currentTab = btn.dataset.tab; render(); });
});

render();
