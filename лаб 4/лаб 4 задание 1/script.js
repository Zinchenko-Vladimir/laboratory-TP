'use strict';

const form = document.getElementById('studentForm');
const fullName = document.getElementById('fullName');
const email = document.getElementById('email');
const course = document.getElementById('course');
const agree = document.getElementById('agree');
const message = document.getElementById('message');
const nameCounter = document.getElementById('nameCounter');

const NAME_REGEX = /^[A-Za-zА-Яа-яЁё-]+(\s+[A-Za-zА-Яа-яЁё-]+)+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Показывает или убирает сообщение об ошибке рядом с полем
function setError(element, text) {
  document.getElementById(element.id + '-error').textContent = text;
  if (element.type !== 'checkbox') {
    element.classList.toggle('invalid', text !== '');
    element.classList.toggle('valid', text === '');
  }
}

// Каждая функция возвращает текст ошибки или пустую строку
function checkName() {
  const value = fullName.value.trim();
  if (value === '') return 'Введите ФИО.';
  if (!NAME_REGEX.test(value)) return 'Укажите минимум фамилию и имя, только буквами.';
  return '';
}

function checkEmail() {
  const value = email.value.trim();
  if (value === '') return 'Введите e-mail.';
  if (!EMAIL_REGEX.test(value)) return 'Проверьте e-mail: он должен выглядеть как name@example.com.';
  return '';
}

function checkCourse() {
  return course.value === '' ? 'Выберите курс из списка.' : '';
}

function checkAgree() {
  return agree.checked ? '' : 'Подтвердите согласие с правилами.';
}

const validators = [
  [fullName, checkName],
  [email, checkEmail],
  [course, checkCourse],
  [agree, checkAgree]
];

// Проверка одного поля
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
    message.textContent = 'Форма содержит ошибки. Исправьте отмеченные поля.';
    return;
  }

  message.className = 'message ok';
  message.textContent = 'Форма заполнена корректно. Регистрация принята.';
});

// Творческое задание: проверка «на лету» и счётчик символов
validators.forEach(function ([element, check]) {
  const eventName = element.tagName === 'SELECT' || element.type === 'checkbox' ? 'change' : 'blur';
  element.addEventListener(eventName, function () { validateField(element, check); });
});

fullName.addEventListener('input', function () {
  nameCounter.textContent = fullName.value.length + ' / ' + fullName.maxLength;
  if (fullName.classList.contains('invalid')) validateField(fullName, checkName);
});
email.addEventListener('input', function () {
  if (email.classList.contains('invalid')) validateField(email, checkEmail);
});
