import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registerform.css';

const Registerform = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Сброс ошибки перед новым запросом

    try {
      const response = await fetch('https://nukesul-backend-1bde.twc1.net/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Регистрация прошла успешно!');
        navigate('/confirm-code'); // Перенаправление на страницу подтверждения кода
      } else {
        setErrorMessage(data.message || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setErrorMessage('Ошибка при подключении к серверу');
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1 className="register-title">Регистрация</h1>
        <p className="register-subtitle">Создайте аккаунт, чтобы оформить заказ</p>
        <form className="register-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="firstName">Имя</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="Введите ваше имя"
              className="form-input5"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Фамилия</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Введите вашу фамилию"
              className="form-input5"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Номер телефона</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Введите ваш номер телефона"
              className="form-input5"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Электронная почта</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Введите ваш email"
              className="form-input5"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Придумайте пароль"
              className="form-input5"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button type="submit" className="register-button">
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registerform;
