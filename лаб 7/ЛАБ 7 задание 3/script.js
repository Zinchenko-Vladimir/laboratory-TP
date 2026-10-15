"use strict";

/* ===== Данные ===== */
const EVENTS = [
  { id: 1, title: "День открытых дверей", date: "2026-10-20", place: "Главный корпус, ауд. 101", capacity: 40 },
  { id: 2, title: "Лекция по кибербезопасности", date: "2026-10-24", place: "Актовый зал", capacity: 120 },
  { id: 3, title: "Олимпиада по программированию", date: "2026-11-02", place: "Компьютерный класс 3", capacity: 3 },
  { id: 4, title: "Мастер-класс по Git и GitHub", date: "2026-11-10", place: "Ауд. 214", capacity: 25 }
];
const STORE_KEY = "lab7-event-people";
let participants = loadPeople();   // [{id, name, email, eventId}]
let currentTab = "events";
let selectedEventId = "";          // предвыбор события в форме
let formMessage = null;            // {text, bad}
let filterEventId = "";            // фильтр на вкладке «Участники»

function loadPeople() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (e) { /* хранилище недоступно */ }
  return [
    { id: 1, name: "Айдар Нурланов", email: "aidar@example.com", eventId: 3 },
    { id: 2, name: "Мария Ким", email: "maria@example.com", eventId: 3 },
    { id: 3, name: "Дана Сериккызы", email: "dana@example.com", eventId: 1 }
  ];
}
function savePeople() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(participants)); } catch (e) { /* ничего */ }
}

/* ===== Логика (без DOM) ===== */
const findEvent = id => EVENTS.find(e => e.id === Number(id));
const takenSeats = eventId => participants.filter(p => p.eventId === Number(eventId)).length;
const seatsLeft = eventId => findEvent(eventId).capacity - takenSeats(eventId);
const formatDate = iso => iso.split("-").reverse().join(".");

// Проверка формы: возвращает объект {поле: сообщение}. Пустой объект — ошибок нет.
function validateRegistration(values, people) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();

  if (name.length < 2) errors.name = "Введите имя: минимум 2 символа.";
  else if (!/^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІіҺһ\s'-]+$/.test(name)) errors.name = "В имени допустимы только буквы, пробел и дефис.";

  if (email === "") errors.email = "Введите e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Формат e-mail неверный, например name@example.com.";

  const event = findEvent(values.eventId);
  if (!event) errors.eventId = "Выберите событие.";
  else if (people.filter(p => p.eventId === event.id).length >= event.capacity) errors.eventId = "На это событие мест больше нет.";
  else if (!errors.email && people.some(p => p.eventId === event.id && p.email.toLowerCase() === email)) {
    errors.email = "Этот e-mail уже зарегистрирован на выбранное событие.";
  }
  return errors;
}

/* ===== Помощники DOM ===== */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ===== Вкладка «События» ===== */
function renderEvents(box) {
  EVENTS.forEach(ev => {
    const left = seatsLeft(ev.id);
    const card = el("article", "card");
    card.append(el("h2", "", ev.title));
    card.append(el("div", "meta", formatDate(ev.date) + " · " + ev.place));

    const seats = el("div", "seats", left > 0 ? "Свободно мест: " + left + " из " + ev.capacity : "Мест нет");
    const bar = el("div", "bar" + (left === 0 ? " full" : ""));
    const fill = el("span");
    fill.style.width = Math.round(100 * takenSeats(ev.id) / ev.capacity) + "%";
    bar.append(fill);
    seats.append(bar);
    card.append(seats);

    const btn = el("button", "btn", left > 0 ? "Записаться" : "Мест нет");
    btn.type = "button";
    btn.disabled = left === 0;
    btn.addEventListener("click", () => { selectedEventId = String(ev.id); formMessage = null; setTab("register"); });
    card.append(btn);
    box.append(card);
  });
}

/* ===== Вкладка «Регистрация» ===== */
function buildField(id, labelText, control) {
  const wrap = el("div", "field");
  const label = el("label", "", labelText);
  label.htmlFor = id;
  control.id = id;
  const err = el("div", "field-error");
  err.id = id + "-error";
  err.setAttribute("role", "alert");
  control.setAttribute("aria-describedby", err.id);
  wrap.append(label, control, err);
  return wrap;
}
function showErrors(form, errors) {
  ["name", "email", "eventId"].forEach(key => {
    const wrap = form.querySelector("#f-" + key).closest(".field");
    wrap.classList.toggle("invalid", Boolean(errors[key]));
    wrap.querySelector(".field-error").textContent = errors[key] || "";
  });
}

function renderRegister(box) {
  if (formMessage) {
    box.append(el("div", "notice" + (formMessage.bad ? " bad" : ""), formMessage.text));
  }
  const form = el("form", "card");
  form.noValidate = true;

  const name = el("input"); name.type = "text"; name.autocomplete = "name";
  const email = el("input"); email.type = "email"; email.autocomplete = "email";
  const select = el("select");
  const placeholder = el("option", "", "— выберите событие —");
  placeholder.value = "";
  select.append(placeholder);
  EVENTS.forEach(ev => {
    const left = seatsLeft(ev.id);
    const opt = el("option", "", ev.title + " (" + (left > 0 ? "мест: " + left : "мест нет") + ")");
    opt.value = String(ev.id);
    opt.disabled = left === 0;
    select.append(opt);
  });
  select.value = selectedEventId;

  form.append(buildField("f-name", "Имя и фамилия", name));
  form.append(buildField("f-email", "E-mail", email));
  form.append(buildField("f-eventId", "Событие", select));

  const submit = el("button", "btn", "Зарегистрироваться");
  submit.type = "submit";
  form.append(submit);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const values = { name: name.value, email: email.value, eventId: select.value };
    const errors = validateRegistration(values, participants);
    showErrors(form, errors);
    if (Object.keys(errors).length) {
      form.querySelector(".invalid input, .invalid select").focus();
      return;
    }
    const nextId = participants.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    participants.push({ id: nextId, name: values.name.trim(), email: values.email.trim(), eventId: Number(values.eventId) });
    savePeople();
    formMessage = { text: values.name.trim() + ", вы зарегистрированы на «" + findEvent(values.eventId).title + "».", bad: false };
    selectedEventId = "";
    render();
  });
  box.append(form);
}

/* ===== Вкладка «Участники» ===== */
function renderPeople(box) {
  const toolbar = el("div", "toolbar");
  const label = el("label", "", "Событие:");
  label.htmlFor = "filter-event";
  const select = el("select");
  select.id = "filter-event";
  const all = el("option", "", "Все события"); all.value = "";
  select.append(all);
  EVENTS.forEach(ev => { const o = el("option", "", ev.title); o.value = String(ev.id); select.append(o); });
  select.value = filterEventId;
  select.addEventListener("change", () => { filterEventId = select.value; render(); });
  toolbar.append(label, select);
  box.append(toolbar);

  const list = participants.filter(p => !filterEventId || p.eventId === Number(filterEventId));
  if (list.length === 0) {
    box.append(el("div", "empty", "Участников пока нет. Зарегистрируйтесь на вкладке «Регистрация»."));
    return;
  }
  list.forEach(p => {
    const card = el("article", "card person");
    const info = el("div");
    info.append(el("strong", "", p.name), el("span", "meta", p.email + " · " + findEvent(p.eventId).title));
    const del = el("button", "btn ghost", "Отменить");
    del.type = "button";
    del.setAttribute("aria-label", "Отменить регистрацию: " + p.name);
    del.addEventListener("click", () => {
      participants = participants.filter(x => x.id !== p.id);
      savePeople();
      render();
    });
    card.append(info, del);
    box.append(card);
  });
}

/* ===== Общая отрисовка ===== */
const VIEWS = { events: renderEvents, register: renderRegister, people: renderPeople };

function render() {
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === currentTab));
  document.getElementById("count-events").textContent = EVENTS.length;
  document.getElementById("count-people").textContent = participants.length;
  const box = document.getElementById("content");
  box.replaceChildren();
  VIEWS[currentTab](box);
}
function setTab(name) {
  currentTab = name;
  if (name !== "register") formMessage = null;
  render();
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});
render();
