// Описание колонок и допустимых переходов между статусами
export const COLUMNS = [
  { id: "todo", title: "К выполнению" },
  { id: "doing", title: "В работе" },
  { id: "done", title: "Готово" }
];

const order = COLUMNS.map(c => c.id);

export function isValidStatus(status) {
  return order.includes(status);
}

// direction: -1 (влево) или +1 (вправо); null, если перехода нет
export function neighborStatus(status, direction) {
  const next = order[order.indexOf(status) + direction];
  return next ?? null;
}
