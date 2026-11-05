// Вычислительная логика: без работы с DOM
export function calculateDiscount(price, percent) {
  return Math.round(price * percent) / 100;
}

export function calculateTotal(price, percent) {
  return Math.round((price - calculateDiscount(price, percent)) * 100) / 100;
}
