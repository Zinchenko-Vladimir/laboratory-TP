import { addItem, removeItem, setQuantity } from "./modules/cart.js";
import { renderCatalog, renderCart, showMessage } from "./modules/ui.js";

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
