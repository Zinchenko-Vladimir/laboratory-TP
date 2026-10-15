"use strict";

const MENU = [
  { name: "Эспрессо", category: "Кофе", price: 600, desc: "Классический двойной шот" },
  { name: "Капучино", category: "Кофе", price: 900, desc: "Эспрессо и молочная пена" },
  { name: "Латте", category: "Кофе", price: 1000, desc: "Много молока, мягкий вкус" },
  { name: "Чизкейк", category: "Десерты", price: 1200, desc: "Сливочный, с ягодным соусом" },
  { name: "Круассан", category: "Десерты", price: 700, desc: "Слоёный, свежий каждое утро" },
  { name: "Паста с курицей", category: "Обеды", price: 2200, desc: "Сливочный соус, пармезан" },
  { name: "Сэндвич с индейкой", category: "Обеды", price: 1800, desc: "Ржаной хлеб, овощи, соус" }
];
const PROMOS = [
  { title: "Кофе + десерт", text: "Скидка 15% при заказе любого кофе и десерта.", period: "по будням до 12:00" },
  { title: "Студентам", text: "Скидка 10% по студенческому билету.", period: "каждый день" },
  { title: "Пятый кофе в подарок", text: "Собирайте отметки в карте гостя.", period: "без ограничений" }
];
const ADDRESS = {
  "Адрес": "г. Алматы, ул. Университетская, 12",
  "Телефон": "+7 (727) 000-00-00",
  "Часы работы": "Пн–Пт 8:00–21:00, Сб–Вс 10:00–20:00",
  "Как добраться": "5 минут пешком от главного корпуса"
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const formatPrice = n => n.toLocaleString("ru-RU") + " ₸";

function renderMenu(box) {
  let lastCategory = "";
  MENU.forEach(dish => {
    if (dish.category !== lastCategory) {
      box.append(el("h2", "group", dish.category));
      lastCategory = dish.category;
    }
    const card = el("article", "card");
    card.append(el("h2", "", dish.name), el("p", "", dish.desc), el("span", "price", formatPrice(dish.price)));
    box.append(card);
  });
}
function renderPromo(box) {
  PROMOS.forEach(p => {
    const card = el("article", "card");
    card.append(el("h2", "", p.title), el("p", "", p.text), el("span", "price", p.period));
    box.append(card);
  });
}
function renderAddress(box) {
  const card = el("article", "card wide");
  const dl = el("dl");
  for (const [key, value] of Object.entries(ADDRESS)) {
    dl.append(el("dt", "", key), el("dd", "", value));
  }
  card.append(dl);
  box.append(card);
}

const TABS = { menu: renderMenu, promo: renderPromo, address: renderAddress };

function showTab(name) {
  const box = document.getElementById("content");
  box.replaceChildren();
  TABS[name](box);
  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});
showTab("menu");
