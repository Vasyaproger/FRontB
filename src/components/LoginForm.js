import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginForm.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Для переключения между формами входа и регистрации
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/'); // Если токен есть, перенаправляем на главную
    }
  }, [navigate]);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://nukesul-backend-1bde.twc1.net/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Ошибка входа');
        return;
      }

      const data = await response.json();
      if (!data.token || !data.userId) {
        setError('Отсутствует токен или userId в ответе');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', email);
      navigate('/');
    } catch (error) {
      setError('Произошла ошибка. Попробуйте еще раз.');
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://nukesul-backend-1bde.twc1.net/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Регистрация прошла успешно!');
        navigate('/login');
      } else {
        setError(data.message || 'Ошибка регистрации');
      }
    } catch (error) {
      setError('Ошибка при подключении к серверу');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">{isLogin ? 'Войти в систему' : 'Зарегистрироваться'}</h1>
        <p className="login-subtitle">
          {isLogin
            ? 'Введите ваш email и пароль для входа'
            : 'Введите email и пароль для регистрации'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form
          className="login-form"
          onSubmit={isLogin ? handleSubmitLogin : handleSubmitRegister}
        >
          <div className="form-group">
            <label htmlFor="email">Электронная почта</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Введите ваш email"
              className="form-input"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Введите ваш пароль"
              className="form-input"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <button type="submit" className="login-button">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <p className="register-link">
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button
              type="button"
              onClick={() => setIsLogin((prev) => !prev)} // Переключение между формами
              className="toggle-button"
            >
              {isLogin ? 'Зарегистрируйтесь' : 'Войдите'}
            </button>
          </p>
        </form>
        <button
          className="back-button"
          onClick={() => navigate(-1)} // Возвращает на предыдущую страницу
        >
          Назад
        </button>
      </div>
    </div>
  );
}

export default LoginForm;
