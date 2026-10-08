"use strict";

const form = document.querySelector("#student-form");
const nameInput = document.querySelector("#student-name");
const scoreInput = document.querySelector("#student-score");
const tbody = document.querySelector("#student-body");
const message = document.querySelector("#student-message");
const emptyText = document.querySelector("#student-empty");


function renumber() {
  const rows = tbody.querySelectorAll("tr");
  rows.forEach((row, i) => {
    row.cells[0].textContent = i + 1;
  });
  emptyText.hidden = rows.length > 0;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const scoreText = scoreInput.value.trim();
  const score = Number(scoreText);

  if (name === "") {
    message.textContent = "Введите имя студента.";
    return;
  }
  if (scoreText === "" || Number.isNaN(score) || score < 0 || score > 100) {
    message.textContent = "Балл должен быть числом от 0 до 100.";
    return;
  }
  message.textContent = "";

  const row = document.createElement("tr");
  row.className = score >= 60 ? "good" : "weak";

  const numCell = document.createElement("td");
  const nameCell = document.createElement("td");
  nameCell.textContent = name;
  const scoreCell = document.createElement("td");
  scoreCell.textContent = score;
  const actionCell = document.createElement("td");

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "danger";
  delBtn.textContent = "Удалить";
  actionCell.append(delBtn);

  row.append(numCell, nameCell, scoreCell, actionCell);
  tbody.append(row);

  renumber();
  form.reset();
  nameInput.focus();
});


tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button.danger");
  if (!btn) return;
  btn.closest("tr").remove();
  renumber();
});

renumber();
