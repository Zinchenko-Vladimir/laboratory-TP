import { useState } from 'react';
import './App.css';

// Дочерний компонент: подпись приходит через props, лайки хранятся в state
function LikeButton({ label, emoji }) {
  const [likes, setLikes] = useState(0);

  return (
    <section className="card">
      <h2>
        {emoji} {label}
      </h2>
      <p>
        Лайков: <strong>{likes}</strong>
      </p>
      <div className="row">
        <button onClick={() => setLikes((n) => n + 1)}>Лайк</button>
        <button
          onClick={() => setLikes((n) => Math.max(0, n - 1))}
          disabled={likes === 0}
        >
          Убрать лайк
        </button>
        <button onClick={() => setLikes(0)}>Сброс</button>
      </div>
      {likes === 0 && <p className="hint">Пока нет лайков. Нажмите «Лайк».</p>}
    </section>
  );
}

// Родитель передаёт props (label, emoji)
export default function App() {
  return (
    <main className="container">
      <h1>Вариант 1 — Счётчик лайков</h1>
      <LikeButton label="Лайк для поста" emoji="👍" />
      <LikeButton label="Лайк для фото" emoji="❤️" />
    </main>
  );
}
