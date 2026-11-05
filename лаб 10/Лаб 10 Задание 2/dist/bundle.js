(function () {
// ===== products.js =====
// Данные: каталог товаров
const products = [
  { id: 1, name: "Тетрадь", price: 250 },
  { id: 2, name: "Ручка", price: 120 },
  { id: 3, name: "Блокнот A5", price: 900 },
  { id: 4, name: "Маркер", price: 350 },
  { id: 5, name: "Папка", price: 600 }
];

function findProduct(id) {
  return products.find(p => p.id === id) ?? null;
}

// ===== cart.js =====
// Логика корзины: без DOM. Корзина — массив { id, qty }

function addItem(items, id) {
  const existing = items.find(i => i.id === id);
  if (existing) return items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
  return [...items, { id, qty: 1 }];
}

function removeItem(items, id) {
  return items.filter(i => i.id !== id);
}

function setQuantity(items, id, qty) {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error("Количество должно быть целым числом не меньше 1");
  }
  if (qty > 99) throw new Error("Максимум 99 штук одного товара");
  return items.map(i => i.id === id ? { ...i, qty } : i);
}

function calculateTotal(items) {
  return items.reduce((sum, i) => sum + findProduct(i.id).price * i.qty, 0);
}

// ===== ui.js =====
// Отображение: только работа с DOM


const fmt = n => `${n.toLocaleString("ru-RU")} ₸`;

function renderCatalog(container) {
  container.innerHTML = "";
  for (const p of products) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.name} — ${fmt(p.price)}</span>`;
    const btn = document.createElement("button");
    btn.textContent = "В корзину";
    btn.dataset.action = "add";
    btn.dataset.id = p.id;
    li.append(btn);
    container.append(li);
  }
}

function renderCart(container, totalEl, items) {
  container.innerHTML = "";
  if (items.length === 0) {
    container.innerHTML = "<li>Корзина пуста</li>";
  }
  for (const item of items) {
    const p = findProduct(item.id);
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.name} × </span>
      <input type="number" min="1" max="99" value="${item.qty}" data-action="qty" data-id="${item.id}">
      <span>${fmt(p.price * item.qty)}</span>
      <button class="danger" data-action="remove" data-id="${item.id}">✕</button>`;
    container.append(li);
  }
  totalEl.textContent = `Итого: ${fmt(calculateTotal(items))}`;
}

function showMessage(el, text) {
  el.textContent = text;
}

// ===== main.js =====


const catalogEl = document.querySelector("#catalog");
const cartEl = document.querySelector("#cart");
const totalEl = document.querySelector("#total");
const messageEl = document.querySelector("#message");

let items = [];

function refresh() {
  renderCart(cartEl, totalEl, items);
}

renderCatalog(catalogEl);
refresh();

catalogEl.addEventListener("click", e => {
  if (e.target.dataset.action !== "add") return;
  items = addItem(items, Number(e.target.dataset.id));
  showMessage(messageEl, "");
  refresh();
});

cartEl.addEventListener("click", e => {
  if (e.target.dataset.action !== "remove") return;
  items = removeItem(items, Number(e.target.dataset.id));
  showMessage(messageEl, "");
  refresh();
});

cartEl.addEventListener("change", e => {
  if (e.target.dataset.action !== "qty") return;
  try {
    items = setQuantity(items, Number(e.target.dataset.id), Number(e.target.value));
    showMessage(messageEl, "");
  } catch (err) {
    showMessage(messageEl, err.message);
  }
  refresh();
});

document.querySelector("#clear").addEventListener("click", () => {
  items = [];
  showMessage(messageEl, "");
  refresh();
});

})();
