// Задание 1. Мини-калькулятор двух чисел

const num1Input = document.getElementById("num1");
const num2Input = document.getElementById("num2");
const result = document.getElementById("result");
const opButtons = document.querySelectorAll(".op");

// Пользовательская функция: выполняет операцию над двумя числами.
// Возвращает число или null, если операция невозможна (деление на ноль).
function calculate(a, b, op) {
  if (op === "+") {
    return a + b;
  } else if (op === "-") {
    return a - b;
  } else if (op === "*") {
    return a * b;
  } else if (op === "/") {
    if (b === 0) {
      return null;
    }
    return a / b;
  }
  return null;
}

function showMessage(text, isError) {
  result.textContent = text;
  result.classList.toggle("error", isError);
}

function onOperationClick(op) {
  // value у input[type=number] — строка; пустая строка означает "не введено"
  if (num1Input.value === "" || num2Input.value === "") {
    showMessage("Введите оба числа", true);
    return;
  }

  const a = Number(num1Input.value);
  const b = Number(num2Input.value);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    showMessage("Некорректное число", true);
    return;
  }

  const res = calculate(a, b, op);

  if (res === null) {
    showMessage("Ошибка: деление на ноль невозможно", true);
    return;
  }

  // Убираем «хвосты» вроде 0.1 + 0.2 = 0.30000000000000004
  const rounded = Number(res.toFixed(10));
  const symbol = op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : "+";
  showMessage(`${a} ${symbol} ${b} = ${rounded}`, false);
}

// Событие 1: click — цикл навешивает обработчик на каждую кнопку
for (const button of opButtons) {
  button.addEventListener("click", () => {
    onOperationClick(button.dataset.op);
  });
}

// Событие 2: input — при изменении чисел сбрасываем старый результат
function resetResult() {
  showMessage("Выберите действие", false);
}
num1Input.addEventListener("input", resetResult);
num2Input.addEventListener("input", resetResult);
