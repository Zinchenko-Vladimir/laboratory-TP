import { useState } from 'react';
import './App.css';

const CATEGORIES = ['Еда', 'Транспорт', 'Учёба', 'Развлечения', 'Другое'];

// Дочерний компонент 1: форма. Родитель передаёт categories и onAdd через props
function ExpenseForm({ categories, onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!title.trim()) {
      setError('Введите название расхода');
      return;
    }
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    onAdd({ id: Date.now(), title: title.trim(), amount: value, category });
    setTitle('');
    setAmount('');
    setError('');
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Новый расход</h2>
      <div className="row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
        />
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Сумма"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="submit">Добавить</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

// Дочерний компонент 2: список. Получает expenses и onDelete через props
function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return <p className="hint">Расходов нет.</p>;
  }
  return (
    <ul className="list">
      {expenses.map((e) => (
        <li key={e.id} className="todo">
          <span>
            {e.title} <small>({e.category})</small>
          </span>
          <span>
            <strong>{e.amount} ₸</strong>{' '}
            <button className="danger" onClick={() => onDelete(e.id)}>
              ✕
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Родитель хранит список, фильтр и считает общую сумму
export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('Все');

  const addExpense = (expense) => setExpenses((prev) => [...prev, expense]);
  const deleteExpense = (id) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  const visible =
    filter === 'Все' ? expenses : expenses.filter((e) => e.category === filter);
  const total = visible.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="container">
      <h1>Вариант 16 — Планировщик расходов</h1>
      <ExpenseForm categories={CATEGORIES} onAdd={addExpense} />

      <section className="card">
        <div className="row">
          <label>
            Фильтр:{' '}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>Все</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button onClick={() => setFilter('Все')}>Сбросить фильтр</button>
        </div>
        <ExpenseList expenses={visible} onDelete={deleteExpense} />
        <p>
          Итого ({filter}): <strong>{total} ₸</strong>
        </p>
      </section>
    </main>
  );
}
