import { createTask, addTask, moveTask, removeTask } from "./modules/tasks.js";
import { loadTasks, saveTasks } from "./modules/storage.js";
import { renderBoard, showMessage } from "./modules/ui.js";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const board = document.querySelector("#board");
const messageEl = document.querySelector("#message");

let tasks = loadTasks();

function update(newTasks) {
  tasks = newTasks;
  saveTasks(tasks);
  renderBoard(board, tasks);
}

renderBoard(board, tasks);

form.addEventListener("submit", e => {
  e.preventDefault();
  try {
    update(addTask(tasks, createTask(titleInput.value)));
    showMessage(messageEl, "");
    titleInput.value = "";
  } catch (err) {
    showMessage(messageEl, err.message);
  }
  titleInput.focus();
});

board.addEventListener("click", e => {
  const { action, id } = e.target.dataset;
  if (!action) return;
  const taskId = Number(id);
  if (action === "left") update(moveTask(tasks, taskId, -1));
  if (action === "right") update(moveTask(tasks, taskId, 1));
  if (action === "delete") update(removeTask(tasks, taskId));
});

document.querySelector("#clear").addEventListener("click", () => {
  if (tasks.length && confirm("Удалить все задачи?")) update([]);
});
