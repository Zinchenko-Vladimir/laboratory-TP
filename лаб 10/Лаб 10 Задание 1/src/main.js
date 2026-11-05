import { calculateDiscount, calculateTotal } from "./modules/pricing.js";
import { validatePrice, validatePercent } from "./modules/validators.js";

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
