// Отображение: только работа с DOM
import { products, findProduct } from "./products.js";
import { calculateTotal } from "./cart.js";

const fmt = n => `${n.toLocaleString("ru-RU")} ₸`;

export function renderCatalog(container) {
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

export function renderCart(container, totalEl, items) {
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

export function showMessage(el, text) {
  el.textContent = text;
}
