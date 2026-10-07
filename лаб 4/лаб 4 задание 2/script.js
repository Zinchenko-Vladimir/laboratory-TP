'use strict';

const form = document.getElementById('accountForm');
const login = document.getElementById('login');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmField = document.getElementById('confirm');
const showPassword = document.getElementById('showPassword');
const message = document.getElementById('message');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

const LOGIN_REGEX = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

function setError(element, text) {
  document.getElementById(element.id + '-error').textContent = text;
  element.classList.toggle('invalid', text !== '');
  element.classList.toggle('valid', text === '');
}

function checkLogin() {
  const value = login.value.trim();
  if (value === '') return 'Введите логин.';
  if (!LOGIN_REGEX.test(value)) return 'Логин: 3–20 символов, только латинские буквы, цифры и «_».';
  return '';
}

function checkEmail() {
  const value = email.value.trim();
  if (value === '') return 'Введите e-mail.';
  if (!EMAIL_REGEX.test(value)) return 'Проверьте e-mail: он должен выглядеть как name@example.com.';
  return '';
}

function checkPassword() {
  const value = password.value;
  if (value === '') return 'Введите пароль.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return 'Пароль слишком короткий: нужно минимум ' + MIN_PASSWORD_LENGTH +
           ' символов, сейчас ' + value.length + '.';
  }
  return '';
}

function checkConfirm() {
  if (confirmField.value === '') return 'Повторите пароль.';
  if (confirmField.value !== password.value) return 'Пароли не совпадают. Введите одинаковые значения.';
  return '';
}

const validators = [
  [login, checkLogin],
  [email, checkEmail],
  [password, checkPassword],
  [confirmField, checkConfirm]
];

function validateField(element, check) {
  const error = check();
  setError(element, error);
  return error === '';
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  let allValid = true;
  validators.forEach(function ([element, check]) {
    if (!validateField(element, check)) allValid = false;
  });

  if (!allValid) {
    message.className = 'message fail';
    message.textContent = 'Аккаунт не создан. Исправьте отмеченные поля.';
    return;
  }

  message.className = 'message ok';
  message.textContent = 'Проверка пройдена. Аккаунт «' + login.value.trim() + '» готов к созданию.';
});

// Творческое задание 1: индикатор надёжности пароля
function passwordScore(value) {
  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score++;
  if (value.length >= 12) score++;
  if (/[a-zа-яё]/.test(value) && /[A-ZА-ЯЁ]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-zА-Яа-яЁё0-9]/.test(value)) score++;
  return score; // 0..5
}

function updateStrength() {
  const value = password.value;
  const levels = [
    { text: 'Минимум ' + MIN_PASSWORD_LENGTH + ' символов.', color: '#b3261e' },
    { text: 'Очень слабый пароль', color: '#b3261e' },
    { text: 'Слабый пароль', color: '#c96a00' },
    { text: 'Средний пароль', color: '#b58900' },
    { text: 'Хороший пароль', color: '#4b8a2e' },
    { text: 'Надёжный пароль', color: '#1f7a3f' }
  ];
  const score = value === '' ? 0 : Math.max(1, passwordScore(value));
  strengthBar.style.width = (score / 5) * 100 + '%';
  strengthBar.style.background = levels[score].color;
  strengthText.textContent = levels[score].text;
}

// Творческое задание 2: проверка при вводе
password.addEventListener('input', function () {
  updateStrength();
  if (password.classList.contains('invalid') || password.classList.contains('valid')) {
    validateField(password, checkPassword);
  }
  if (confirmField.value !== '') validateField(confirmField, checkConfirm);
});
confirmField.addEventListener('input', function () { validateField(confirmField, checkConfirm); });
login.addEventListener('blur', function () { validateField(login, checkLogin); });
email.addEventListener('blur', function () { validateField(email, checkEmail); });

// Творческое задание 3: показать/скрыть пароли
showPassword.addEventListener('change', function () {
  const type = showPassword.checked ? 'text' : 'password';
  password.type = type;
  confirmField.type = type;
});
