'use strict';

const form = document.getElementById('bookingForm');
const fullName = document.getElementById('fullName');
const email = document.getElementById('email');
const category = document.getElementById('category');
const quantity = document.getElementById('quantity');
const agree = document.getElementById('agree');
const optionBoxes = document.querySelectorAll('input[name="option"]');
const liveTotal = document.getElementById('liveTotal');
const message = document.getElementById('message');
const summary = document.getElementById('summary');

const TICKETS = {
  standard: { title: 'Стандарт', price: 1500 },
  student: { title: 'Студенческий', price: 800 },
  vip: { title: 'VIP', price: 4000 }
};
const MAX_QUANTITY = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const formatMoney = function (value) {
  return value.toLocaleString('ru-RU') + ' ₸';
};

function setError(element, text) {
  document.getElementById(element.id + '-error').textContent = text;
  if (element.type !== 'checkbox') {
    element.classList.toggle('invalid', text !== '');
    element.classList.toggle('valid', text === '');
  }
}

function checkName() {
  const value = fullName.value.trim();
  if (value === '') return 'Введите имя.';
  if (value.length < 2) return 'Имя слишком короткое: минимум 2 символа.';
  return '';
}

function checkEmail() {
  const value = email.value.trim();
  if (value === '') return 'Введите e-mail.';
  if (!EMAIL_REGEX.test(value)) return 'Проверьте e-mail: он должен выглядеть как name@example.com.';
  return '';
}

function checkCategory() {
  return category.value === '' ? 'Выберите категорию билета.' : '';
}

function checkQuantity() {
  const raw = quantity.value.trim();
  if (raw === '') return 'Введите количество билетов.';
  const number = Number(raw);
  if (!Number.isInteger(number)) return 'Количество должно быть целым числом.';
  if (number < 1 || number > MAX_QUANTITY) return 'Количество должно быть от 1 до ' + MAX_QUANTITY + '.';
  return '';
}

function checkAgree() {
  return agree.checked ? '' : 'Подтвердите согласие с условиями.';
}

const validators = [
  [fullName, checkName],
  [email, checkEmail],
  [category, checkCategory],
  [quantity, checkQuantity],
  [agree, checkAgree]
];

function validateField(element, check) {
  const error = check();
  setError(element, error);
  return error === '';
}

// Расчёт стоимости: билеты × количество + выбранные опции
function getSelectedOptions() {
  return Array.from(optionBoxes)
    .filter(function (box) { return box.checked; })
    .map(function (box) { return { title: box.dataset.title, price: Number(box.dataset.price) }; });
}

function calculateTotal() {
  const ticket = TICKETS[category.value];
  const count = Number(quantity.value);
  const ticketsSum = ticket && Number.isInteger(count) && count > 0 ? ticket.price * count : 0;
  const optionsSum = getSelectedOptions().reduce(function (sum, option) { return sum + option.price; }, 0);
  return { ticketsSum: ticketsSum, optionsSum: optionsSum, total: ticketsSum + optionsSum };
}

function updateLiveTotal() {
  liveTotal.textContent = formatMoney(calculateTotal().total);
}

function renderSummary() {
  const ticket = TICKETS[category.value];
  const sums = calculateTotal();
  const options = getSelectedOptions().map(function (o) { return o.title; });

  summary.innerHTML =
    '<div class="summary"><dl>' +
    '<dt>Имя</dt><dd></dd>' +
    '<dt>E-mail</dt><dd></dd>' +
    '<dt>Билеты</dt><dd></dd>' +
    '<dt>Опции</dt><dd></dd>' +
    '<dt>Итого</dt><dd></dd>' +
    '</dl></div>';

  // textContent защищает от вставки HTML из полей формы
  const values = [
    fullName.value.trim(),
    email.value.trim(),
    ticket.title + ' × ' + quantity.value + ' = ' + formatMoney(sums.ticketsSum),
    options.length ? options.join(', ') + ' (' + formatMoney(sums.optionsSum) + ')' : 'без опций',
    formatMoney(sums.total)
  ];
  summary.querySelectorAll('dd').forEach(function (dd, index) { dd.textContent = values[index]; });
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  summary.innerHTML = '';

  let allValid = true;
  validators.forEach(function ([element, check]) {
    if (!validateField(element, check)) allValid = false;
  });

  if (!allValid) {
    message.className = 'message fail';
    message.textContent = 'Бронь не оформлена. Исправьте отмеченные поля.';
    return;
  }

  message.className = 'message ok';
  message.textContent = 'Проверка пройдена. Бронирование оформлено.';
  renderSummary();
});

// Проверка при вводе и пересчёт стоимости
validators.forEach(function ([element, check]) {
  const isChoice = element.tagName === 'SELECT' || element.type === 'checkbox';
  element.addEventListener(isChoice ? 'change' : 'input', function () {
    validateField(element, check);
    updateLiveTotal();
  });
});
optionBoxes.forEach(function (box) { box.addEventListener('change', updateLiveTotal); });

updateLiveTotal();
