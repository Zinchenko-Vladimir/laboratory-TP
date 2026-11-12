import { useState } from 'react';
import './App.css';

// Дочерний компонент: данные и обработчики приходят через props
function TodoItem({ text, done, onToggle, onDelete }) {
  return (
    <li className={done ? 'todo done' : 'todo'}>
      <label>
        <input type="checkbox" checked={done} onChange={onToggle} />
        <span>{text}</span>
      </label>
      <button className="danger" onClick={onDelete}>
        Удалить
      </button>
    </li>
  );
}

// Родитель хранит список задач в state
function TodoList() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Установить Node.js', done: true },
    { id: 2, text: 'Создать проект Vite', done: false },
  ]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      setError('Введите текст задачи');
      return;
    }
    setTasks((prev) => [...prev, { id: Date.now(), text, done: false }]);
    setInput('');
    setError('');
  };

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const deleteTask = (id) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <section className="card">
      <form className="row" onSubmit={addTask}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Новая задача"
        />
        <button type="submit">Добавить</button>
      </form>
      {error && <p className="error">{error}</p>}

      {tasks.length === 0 ? (
        <p className="hint">Список пуст. Добавьте первую задачу.</p>
      ) : (
        <ul className="list">
          {tasks.map((t) => (
            <TodoItem
              key={t.id}
              text={t.text}
              done={t.done}
              onToggle={() => toggleTask(t.id)}
              onDelete={() => deleteTask(t.id)}
            />
          ))}
        </ul>
      )}
      <p>
        Выполнено: {doneCount} из {tasks.length}
      </p>
    </section>
  );
}

export default function App() {
  return (
    <main className="container">
      <h1>Вариант 8 — Список задач</h1>
      <TodoList />
    </main>
  );
}
