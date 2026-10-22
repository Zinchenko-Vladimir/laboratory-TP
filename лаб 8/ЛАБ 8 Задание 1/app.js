const KEY = "lab8_shopping_list";
const form = document.getElementById("form");
const nameInput = document.getElementById("name");
const errorEl = document.getElementById("error");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const clearBtn = document.getElementById("clear");

// Чтение из localStorage с защитой от пустых данных и неверного JSON
function loadItems() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("не массив");
    return data.filter(i => i && typeof i.id === "number" && typeof i.name === "string");
  } catch (e) {
    console.warn("Повреждённые данные, список сброшен:", e.message);
    localStorage.removeItem(KEY);
    showError("Сохранённые данные были повреждены, список сброшен.");
    return [];
  }
}

function saveItems() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    showError("Не удалось сохранить данные: хранилище недоступно.");
  }
}

function showError(text) { errorEl.textContent = text; }

function render() {
  listEl.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    if (item.bought) li.className = "done";
    const span = document.createElement("span");
    span.textContent = item.name;               // textContent защищает от HTML-вставки
    const buy = document.createElement("button");
    buy.textContent = item.bought ? "Вернуть" : "Куплено";
    buy.onclick = () => { item.bought = !item.bought; saveItems(); render(); };
    const del = document.createElement("button");
    del.textContent = "Удалить";
    del.className = "danger";
    del.onclick = () => { items = items.filter(i => i.id !== item.id); saveItems(); render(); };
    const box = document.createElement("div");
    box.append(buy, " ", del);
    li.append(span, box);
    listEl.append(li);
  });
  emptyEl.style.display = items.length ? "none" : "block";
  clearBtn.style.display = items.length ? "inline-block" : "none";
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) { showError("Введите название товара."); return; }
  if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
    showError("Такой товар уже есть в списке."); return;
  }
  showError("");
  items.push({ id: Date.now(), name, bought: false });
  saveItems();
  nameInput.value = "";
  render();
});

clearBtn.addEventListener("click", () => {
  if (confirm("Удалить все товары?")) { items = []; saveItems(); render(); }
});

let items = loadItems();
render();
