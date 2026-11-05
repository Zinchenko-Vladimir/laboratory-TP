// Хранение: localStorage + защита от испорченных данных
import { isValidStatus } from "./columns.js";

const KEY = "lab10_kanban_tasks";

export function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(t => t && typeof t.title === "string" && isValidStatus(t.status));
  } catch {
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}
