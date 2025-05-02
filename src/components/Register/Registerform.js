import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, RecaptchaVerifier } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../AuthContext';
import { auth, googleProvider, db } from '../firebase';
import './Registerform.css';

const Registerform = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);

  const secretQuestion = 'Какой у вас сегодня день?';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const correctAnswer = today;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // Проверка, что auth определён
      if (!auth) {
        throw new Error('Объект auth не инициализирован. Проверьте firebase.js.');
      }

      // Проверка существования recaptcha-container
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (!recaptchaContainer) {
        throw new Error('Контейнер reCAPTCHA не найден в DOM.');
      }

      // Инициализация reCAPTCHA
      console.log('Инициализация reCAPTCHA...');
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA успешно пройдена');
        },
      });
      await window.recaptchaVerifier.render();

      console.log('Создание пользователя...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newFirebaseUser = userCredential.user;

      await setDoc(doc(db, 'users', newFirebaseUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        createdAt: new Date().toISOString(),
      });

      setFirebaseUser(newFirebaseUser);
      setShowVerification(true);
    } catch (error) {
      console.error('Ошибка регистрации:', error.code, error.message);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('Этот email уже зарегистрирован.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Некорректный формат email.');
          break;
        case 'auth/weak-password':
          setErrorMessage('Пароль слишком слабый (минимум 6 символов).');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Слишком много попыток. Попробуйте позже.');
          break;
        default:
          setErrorMessage(`Ошибка регистрации: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const newFirebaseUser = result.user;

      const userDocRef = doc(db, 'users', newFirebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName: newFirebaseUser.displayName ? newFirebaseUser.displayName.split(' ')[0] : '',
          lastName: newFirebaseUser.displayName ? newFirebaseUser.displayName.split(' ')[1] || '' : '',
          phone: formData.phone || '',
          email: newFirebaseUser.email,
          createdAt: new Date().toISOString(),
        });
      }

      setFirebaseUser(newFirebaseUser);
      setShowVerification(true);
    } catch (error) {
      console.error('Ошибка регистрации через Google:', error.code, error.message);
      setErrorMessage('Ошибка регистрации через Google. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = () => {
    setErrorMessage('');
    if (verificationAnswer.toLowerCase() === correctAnswer) {
      alert('Регистрация успешно подтверждена!');
      navigate('/');
    } else {
      setErrorMessage(`Неверный ответ. Сегодня ${today}. Попробуйте снова.`);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <button className="back-button" onClick={() => navigate('/')}>
          Назад
        </button>
        <h1 className="register-title">Регистрация</h1>
        <p className="register-subtitle">Создайте аккаунт, чтобы оформить заказ</p>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {loading && <div className="spinner">Загрузка...</div>}
        <div id="recaptcha-container"></div>

        {!showVerification ? (
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
            <button
              type="button"
              className="register-button google-button"
              onClick={handleGoogleRegister}
              disabled={loading}
            >
              Зарегистрироваться через Google
            </button>
          </form>
        ) : (
          <div className="verification-step">
            <h2 className="register-title">Подтверждение регистрации</h2>
            <p className="register-subtitle">{secretQuestion}</p>
            <div className="form-group">
              <input
                type="text"
                placeholder="Введите ваш ответ"
                className="form-input5"
                value={verificationAnswer}
                onChange={(e) => setVerificationAnswer(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button
              className="register-button"
              onClick={handleVerification}
              disabled={loading}
            >
              Подтвердить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registerform;