// Логика корзины: без DOM. Корзина — массив { id, qty }
import { findProduct } from "./products.js";

export function addItem(items, id) {
  const existing = items.find(i => i.id === id);
  if (existing) return items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
  return [...items, { id, qty: 1 }];
}

export function removeItem(items, id) {
  return items.filter(i => i.id !== id);
}

export function setQuantity(items, id, qty) {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error("Количество должно быть целым числом не меньше 1");
  }
  if (qty > 99) throw new Error("Максимум 99 штук одного товара");
  return items.map(i => i.id === id ? { ...i, qty } : i);
}

export function calculateTotal(items) {
  return items.reduce((sum, i) => sum + findProduct(i.id).price * i.qty, 0);
}
