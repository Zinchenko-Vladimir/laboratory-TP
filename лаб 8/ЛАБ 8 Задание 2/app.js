const KEY = "lab8_expenses";
const CATEGORIES = ["Еда", "Транспорт", "Жильё", "Развлечения", "Здоровье", "Другое"];
const form = document.getElementById("form");
const categoryEl = document.getElementById("category");
const amountEl = document.getElementById("amount");
const dateEl = document.getElementById("date");
const errorEl = document.getElementById("error");
const rowsEl = document.getElementById("rows");
const totalEl = document.getElementById("total");
const byCatEl = document.getElementById("byCategory");
const emptyEl = document.getElementById("empty");

function isValidRecord(r) {
  return r && typeof r.id === "number" && typeof r.category === "string" &&
         typeof r.amount === "number" && isFinite(r.amount) && typeof r.date === "string";
}

function loadExpenses() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("не массив");
    return data.filter(isValidRecord);
  } catch (e) {
    console.warn("Повреждённый JSON, данные сброшены:", e.message);
    localStorage.removeItem(KEY);
    showError("Сохранённые данные были повреждены и сброшены.");
    return [];
  }
}

function saveExpenses() {
  try { localStorage.setItem(KEY, JSON.stringify(expenses)); }
  catch (e) { showError("Не удалось сохранить данные."); }
}

function showError(t) { errorEl.textContent = t; }
function money(n) { return n.toFixed(2); }

function render() {
  rowsEl.innerHTML = "";
  [...expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(r => {
    const tr = document.createElement("tr");
    [r.date, r.category, money(r.amount)].forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    });
    const td = document.createElement("td");
    const del = document.createElement("button");
    del.textContent = "Удалить";
    del.className = "danger";
    del.onclick = () => { expenses = expenses.filter(x => x.id !== r.id); saveExpenses(); render(); };
    td.append(del);
    tr.append(td);
    rowsEl.append(tr);
  });
  const total = expenses.reduce((s, r) => s + r.amount, 0);
  totalEl.textContent = money(total);
  const sums = {};
  expenses.forEach(r => { sums[r.category] = (sums[r.category] || 0) + r.amount; });
  byCatEl.innerHTML = "";
  Object.entries(sums).forEach(([cat, sum]) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = cat + ": " + money(sum);
    byCatEl.append(chip);
  });
  emptyEl.style.display = expenses.length ? "none" : "block";
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = amountEl.value.trim().replace(",", ".");
  if (!text) { showError("Введите сумму."); return; }
  const amount = Number(text);
  if (!isFinite(amount) || amount <= 0) { showError("Сумма должна быть положительным числом."); return; }
  if (amount > 1e9) { showError("Слишком большая сумма."); return; }
  if (!dateEl.value) { showError("Выберите дату."); return; }
  showError("");
  expenses.push({ id: Date.now(), category: categoryEl.value, amount: Math.round(amount * 100) / 100, date: dateEl.value });
  saveExpenses();
  amountEl.value = "";
  render();
});

CATEGORIES.forEach(c => {
  const o = document.createElement("option");
  o.value = o.textContent = c;
  categoryEl.append(o);
});
dateEl.value = new Date().toISOString().slice(0, 10);
let expenses = loadExpenses();
render();
