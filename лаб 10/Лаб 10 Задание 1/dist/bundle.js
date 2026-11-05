(function () {
// ===== validators.js =====
// Проверка ввода: возвращает текст ошибки или null
function validatePrice(value) {
  if (value === "") return "Введите цену";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Цена должна быть числом";
  if (n < 0) return "Цена не может быть отрицательной";
  return null;
}

function validatePercent(value) {
  if (value === "") return "Введите размер скидки";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Скидка должна быть числом";
  if (n < 0 || n > 100) return "Скидка должна быть от 0 до 100%";
  return null;
}

// ===== pricing.js =====
// Вычислительная логика: без работы с DOM
function calculateDiscount(price, percent) {
  return Math.round(price * percent) / 100;
}

function calculateTotal(price, percent) {
  return Math.round((price - calculateDiscount(price, percent)) * 100) / 100;
}

// ===== main.js =====


const priceInput = document.querySelector("#price");
const percentInput = document.querySelector("#percent");
const output = document.querySelector("#result");

function showMessage(text, isError = false) {
  output.textContent = text;
  output.classList.toggle("error", isError);
}

document.querySelector("#calculate").addEventListener("click", () => {
  const error = validatePrice(priceInput.value) || validatePercent(percentInput.value);
  if (error) return showMessage(error, true);

  const price = Number(priceInput.value);
  const percent = Number(percentInput.value);
  showMessage(`Скидка: ${calculateDiscount(price, percent)} ₸; итого к оплате: ${calculateTotal(price, percent)} ₸`);
});

document.querySelector("#reset").addEventListener("click", () => {
  priceInput.value = "";
  percentInput.value = "";
  showMessage("");
});

})();
