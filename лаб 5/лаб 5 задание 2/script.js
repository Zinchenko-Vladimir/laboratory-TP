// Задание 9. Проверка пароля

const passwordInput = document.getElementById("password");
const toggle = document.getElementById("toggle");
const list = document.getElementById("requirements");
const checkButton = document.getElementById("check");
const message = document.getElementById("message");

const MIN_LENGTH = 8;

// Каждое требование — объект с текстом и функцией проверки
const requirements = [
  {
    text: `Длина не менее ${MIN_LENGTH} символов`,
    check: (pwd) => pwd.length >= MIN_LENGTH,
  },
  {
    text: "Есть хотя бы одна цифра",
    check: (pwd) => /\d/.test(pwd),
  },
];

// Создаём пункты списка требований (цикл)
const items = [];
for (const req of requirements) {
  const li = document.createElement("li");
  li.textContent = req.text;
  list.appendChild(li);
  items.push(li);
}

// Пользовательская функция: обновляет вид списка и возвращает,
// выполнены ли все условия
function validate(pwd) {
  let allOk = true;
  for (let i = 0; i < requirements.length; i++) {
    const passed = requirements[i].check(pwd);
    items[i].classList.toggle("ok", passed);
    if (!passed) {
      allOk = false;
    }
  }
  return allOk;
}

// Событие 1: input — проверка «вживую» при вводе
passwordInput.addEventListener("input", () => {
  validate(passwordInput.value);
  message.textContent = "";
  message.className = "";
});

// Событие 2: click — итоговая проверка по кнопке
checkButton.addEventListener("click", () => {
  const pwd = passwordInput.value;

  if (pwd === "") {
    message.textContent = "Пароль не введён";
    message.className = "fail";
    validate(pwd);
    return;
  }

  if (validate(pwd)) {
    message.textContent = "Пароль подходит: все условия выполнены";
    message.className = "success";
  } else {
    message.textContent = "Пароль не подходит: выполнены не все условия";
    message.className = "fail";
  }
});

// Событие 3: change — показать/скрыть пароль
toggle.addEventListener("change", () => {
  passwordInput.type = toggle.checked ? "text" : "password";
});

// Начальное состояние списка
validate("");
