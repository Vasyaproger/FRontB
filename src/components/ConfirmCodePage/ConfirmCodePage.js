// src/components/ConfirmCodePage/ConfirmCodePage.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './cont.css';

function ConfirmCodePage() {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user.isLoggedIn) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      navigate('/login');
    } else if (user.firebaseUser?.emailVerified) {
      // Если email уже подтвержден, можно продолжить с вводом кода
    } else {
      setErrorMessage('Пожалуйста, подтвердите ваш email, прежде чем продолжить.');
    }
  }, [user, navigate]);

  const handleConfirm = async () => {
    if (!user.firebaseUser?.emailVerified) {
      setErrorMessage('Пожалуйста, подтвердите ваш email, прежде чем вводить код.');
      return;
    }

    try {
      const response = await fetch('vasyaproger-backentboodai-543a.twc1.net/api/confirm-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          navigate('/'); // Перенаправляем на главную после успешного подтверждения
        } else {
          setErrorMessage('Ошибка при подтверждении. Пожалуйста, попробуйте снова.');
        }
      } else {
        setErrorMessage('Неверный код. Пожалуйста, попробуйте снова.');
      }
    } catch (error) {
      setErrorMessage('Ошибка при подтверждении кода.');
    }
  };

  return (
    <div className="tety">
      <div className="confirm-code-container1">
        <h2 className="tt1">Подтверждение аккаунта</h2>
        <div className="form-container5">
          <input
            type="text"
            placeholder="Введите код подтверждения"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-field"
          />
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button className="confirm-button" onClick={handleConfirm}>
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmCodePage;