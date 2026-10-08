"use strict";


const questions = [
  {
    text: "Какой метод возвращает первый элемент, подходящий под CSS-селектор?",
    options: ["getElementsByClassName()", "querySelector()", "getElementsByTagName()", "querySelectorAll()"],
    correct: 1
  },
  {
    text: "Какое свойство задаёт текстовое содержимое элемента?",
    options: ["textContent", "innerStyle", "valueText", "nodeColor"],
    correct: 0
  },
  {
    text: "Какой метод подписывает элемент на событие?",
    options: ["onEvent()", "attachClick()", "addEventListener()", "listenTo()"],
    correct: 2
  },
  {
    text: "Как создать новый элемент <div> в JavaScript?",
    options: ["document.newElement('div')", "document.createElement('div')", "document.add('div')", "new Div()"],
    correct: 1
  },
  {
    text: "Какой метод удаляет элемент из DOM?",
    options: ["element.remove()", "element.hide()", "element.clear()", "element.cut()"],
    correct: 0
  }
];

const progressText = document.querySelector("#quiz-progress");
const bar = document.querySelector("#quiz-bar");
const box = document.querySelector("#quiz-box");
const questionEl = document.querySelector("#quiz-question");
const optionsEl = document.querySelector("#quiz-options");
const feedback = document.querySelector("#quiz-feedback");
const nextBtn = document.querySelector("#quiz-next");
const resultBox = document.querySelector("#quiz-result");
const scoreEl = document.querySelector("#quiz-score");
const commentEl = document.querySelector("#quiz-comment");
const restartBtn = document.querySelector("#quiz-restart");

let current = 0;
let score = 0;

function showQuestion() {
  const q = questions[current];
  progressText.textContent = `Вопрос ${current + 1} из ${questions.length}`;
  bar.style.width = `${(current / questions.length) * 100}%`;
  questionEl.textContent = q.text;
  feedback.textContent = "";
  feedback.classList.remove("ok");
  nextBtn.hidden = true;
  nextBtn.textContent = current === questions.length - 1 ? "Показать результат" : "Дальше";
  optionsEl.innerHTML = "";

  q.options.forEach((text, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = text;
    btn.dataset.index = index;
    optionsEl.append(btn);
  });
}

function selectAnswer(e) {
  const btn = e.target.closest("button.option");
  if (!btn) return;

  const chosen = Number(btn.dataset.index);
  const correct = questions[current].correct;
  const buttons = optionsEl.querySelectorAll("button.option");

  buttons.forEach((b) => (b.disabled = true));
  buttons[correct].classList.add("correct");

  if (chosen === correct) {
    score++;
    feedback.textContent = "Верно!";
    feedback.classList.add("ok");
  } else {
    btn.classList.add("wrong");
    feedback.textContent = "Неверно. Правильный ответ подсвечен зелёным.";
    feedback.classList.remove("ok");
  }
  nextBtn.hidden = false;
}

function nextStep() {
  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  box.hidden = true;
  resultBox.hidden = false;
  bar.style.width = "100%";
  progressText.textContent = "Тест завершён";
  scoreEl.textContent = `Ваш результат: ${score} из ${questions.length}`;

  if (score === questions.length) commentEl.textContent = "Отлично! Все ответы верные.";
  else if (score >= 3) commentEl.textContent = "Хороший результат, но есть что повторить.";
  else commentEl.textContent = "Стоит перечитать тему про DOM и события.";
}

function restart() {
  current = 0;
  score = 0;
  resultBox.hidden = true;
  box.hidden = false;
  showQuestion();
}

optionsEl.addEventListener("click", selectAnswer);
nextBtn.addEventListener("click", nextStep);
restartBtn.addEventListener("click", restart);

showQuestion();
