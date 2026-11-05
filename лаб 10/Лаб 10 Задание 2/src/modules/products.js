// Данные: каталог товаров
export const products = [
  { id: 1, name: "Тетрадь", price: 250 },
  { id: 2, name: "Ручка", price: 120 },
  { id: 3, name: "Блокнот A5", price: 900 },
  { id: 4, name: "Маркер", price: 350 },
  { id: 5, name: "Папка", price: 600 }
];

export function findProduct(id) {
  return products.find(p => p.id === id) ?? null;
}
