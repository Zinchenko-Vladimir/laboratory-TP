// Логика задач: чистые функции, без DOM и без хранилища
import { neighborStatus } from "./columns.js";

export function createTask(title) {
  const clean = String(title).trim();
  if (clean === "") throw new Error("Название задачи не может быть пустым");
  if (clean.length < 3) throw new Error("Название должно содержать минимум 3 символа");
  if (clean.length > 80) throw new Error("Название не должно превышать 80 символов");
  return { id: Date.now() + Math.floor(Math.random() * 1000), title: clean, status: "todo" };
}

export function addTask(tasks, task) {
  const duplicate = tasks.some(t => t.title.toLowerCase() === task.title.toLowerCase() && t.status === task.status);
  if (duplicate) throw new Error("Такая задача уже есть в этой колонке");
  return [...tasks, task];
}

export function moveTask(tasks, id, direction) {
  return tasks.map(t => {
    if (t.id !== id) return t;
    const status = neighborStatus(t.status, direction);
    return status ? { ...t, status } : t;
  });
}

export function removeTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

export function tasksByStatus(tasks, status) {
  return tasks.filter(t => t.status === status);
}
