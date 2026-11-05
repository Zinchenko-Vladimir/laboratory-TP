// Проверка ввода: возвращает текст ошибки или null
export function validatePrice(value) {
  if (value === "") return "Введите цену";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Цена должна быть числом";
  if (n < 0) return "Цена не может быть отрицательной";
  return null;
}

export function validatePercent(value) {
  if (value === "") return "Введите размер скидки";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Скидка должна быть числом";
  if (n < 0 || n > 100) return "Скидка должна быть от 0 до 100%";
  return null;
}
