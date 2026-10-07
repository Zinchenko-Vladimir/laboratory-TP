// Задание 16. Динамический список задач

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const errorBox = document.getElementById("error");
const tasksList = document.getElementById("tasks");
const doneCount = document.getElementById("doneCount");
const todoCount = document.getElementById("todoCount");

// Массив задач: { id, text, done }
let tasks = [];
let nextId = 1;

// Добавление новой задачи
function addTask() {
  const text = taskInput.value.trim();

  if (text === "") {
    errorBox.textContent = "Введите текст задачи";
    return;
  }

  tasks.push({ id: nextId, text: text, done: false });
  nextId++;

  taskInput.value = "";
  errorBox.textContent = "";
  taskInput.focus();
  render();
}

// Отметка «выполнено» / снятие отметки
function toggleTask(id) {
  for (const task of tasks) {
    if (task.id === id) {
      task.done = !task.done;
    }
  }
  render();
}

// Удаление задачи
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  render();
}

// Полная перерисовка списка и счётчиков
function render() {
  tasksList.innerHTML = "";
  let done = 0;

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Задач пока нет — добавьте первую";
    tasksList.appendChild(empty);
  }

  for (const task of tasks) {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    if (task.done) {
      li.classList.add("done");
      done++;
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Выполнено");

    const span = document.createElement("span");
    span.textContent = task.text; // textContent защищает от вставки HTML

    const delBtn = document.createElement("button");
    delBtn.className = "del";
    delBtn.textContent = "✕";
    delBtn.setAttribute("aria-label", "Удалить задачу");

    li.append(checkbox, span, delBtn);
    tasksList.appendChild(li);
  }

  doneCount.textContent = done;
  todoCount.textContent = tasks.length - done;
}

// События пользователя
addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTask();
  }
});

taskInput.addEventListener("input", () => {
  errorBox.textContent = "";
});

// Делегирование: один обработчик на весь список
tasksList.addEventListener("click", (event) => {
  const li = event.target.closest("li[data-id]");
  if (!li) return;
  const id = Number(li.dataset.id);

  if (event.target.classList.contains("del")) {
    deleteTask(id);
  } else if (event.target.matches("input[type='checkbox']")) {
    toggleTask(id);
  }
});

render();
