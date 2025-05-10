import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './adminney.css';

const BASE_URL = 'https://vasyaproger-backentboodai-543a.twc1.net';

const Adminlogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Проверка наличия токена при монтировании
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/AdminPanel');
    }
  }, [navigate]);

  // Обработчик изменения полей формы
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    setError(''); // Сбрасываем ошибку при изменении ввода
  }, []);

  // Обработчик отправки формы
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const url = `${BASE_URL}/admin/login`;
        console.log('Sending login request to:', url);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        // Проверяем Content-Type ответа
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 200));
          throw new Error('Сервер вернул не JSON-ответ. Проверьте конфигурацию сервера.');
        }

        const data = await response.json();

        if (!response.ok) {
          console.error('Login error response:', data);
          setError(data.error || 'Ошибка входа');
          setEmail('');
          setPassword('');
          return;
        }

        console.log('Login successful, token:', data.token);
        localStorage.setItem('token', data.token);
        navigate('/AdminPanel');
      } catch (error) {
        console.error('Login request error:', error.message);
        setError(error.message || 'Ошибка сети. Проверьте подключение или сервер.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate]
  );

  return (
    <div className="admin-page12">
      <div className="login-box15">
        <h1 className="heading">Вход в админку</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label5" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input1"
              value={email}
              onChange={handleInputChange}
              required
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>
          <div className="form-group">
            <label className="form-label5" htmlFor="password">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input1"
              value={password}
              onChange={handleInputChange}
              required
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>
          <div className="action-buttons">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Adminlogin;