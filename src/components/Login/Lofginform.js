import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Lofginform.css'; // Оставил оригинальное имя файла стилей

function Lofginform() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const baseURL = "https://nukesul-backend-1bde.twc1.net";

  // Проверка токена при монтировании
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    }
  }, []);

  // Получение данных пользователя
  const fetchUserInfo = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('email');
          setError('Сессия истекла. Войдите снова.');
          navigate('/login');
          return;
        }
        throw new Error('Не удалось получить данные пользователя');
      }
      const userData = await response.json();
      setUser(userData);
      setError('');
      navigate('/'); // Перенаправление на главную страницу
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      setError('Ошибка загрузки данных пользователя. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Обработка входа
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Введите email и пароль');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${baseURL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          response.status === 404
            ? 'Пользователь с таким email не найден'
            : response.status === 400
            ? 'Неверный пароль'
            : errorData.message || 'Ошибка входа'
        );
      }

      const data = await response.json();
      if (!data.token || !data.userId) {
        throw new Error('Сервер не вернул токен или userId');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      // Убрано хранение email в localStorage для безопасности

      setEmail('');
      setPassword('');
      setUser(data); // Устанавливаем пользователя сразу
      navigate('/'); // Перенаправление после успешного входа
    } catch (error) {
      console.error('Ошибка входа:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lf-background-container">
      <div className="lf-form-container">
        <h1 className="lf-title">Вход</h1>
        <div className="lf-card">
          {error && <p className="lf-error">{error}</p>}
          {loading && <div className="lf-spinner">Загрузка...</div>}
          <form onSubmit={handleSubmit}>
            <div className="lf-form-group">
              <label className="lf-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="lf-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Введите email"
                disabled={loading}
              />
            </div>
            <div className="lf-form-group">
              <label className="lf-label" htmlFor="password">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                className="lf-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Введите пароль"
                disabled={loading}
              />
            </div>
            <div className="lf-button-group">
              <button type="submit" className="lf-button" disabled={loading}>
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </div>
          </form>
          <div className="lf-register-link">
            <p>
              Нет аккаунта? <Link to="/register">Регистрация</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lofginform;