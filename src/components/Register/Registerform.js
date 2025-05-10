import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPhoneNumber, signInWithPopup, RecaptchaVerifier } from 'firebase/auth';
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
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [verificationAnswer, setVerificationAnswer] = useState(''); // Добавлено состояние

  const secretQuestion = 'Какой у вас сегодня день?';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const correctAnswer = today;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setErrorMessage('Заполните все поля');
      setLoading(false);
      return;
    }

    // Проверка формата номера телефона (например, +996123456789)
    const phoneRegex = /^\+\d{10,12}$/;
    if (!phoneRegex.test(formData.phone)) {
      setErrorMessage('Неверный формат номера телефона (например, +996123456789)');
      setLoading(false);
      return;
    }

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

      console.log('Отправка SMS с кодом подтверждения...');
      const result = await signInWithPhoneNumber(auth, formData.phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setShowCodeInput(true);
    } catch (error) {
      console.error('Ошибка отправки SMS:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-phone-number':
          setErrorMessage('Неверный формат номера телефона.');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Слишком много попыток. Попробуйте позже.');
          break;
        case 'auth/quota-exceeded':
          setErrorMessage('Лимит SMS превышен. Попробуйте позже.');
          break;
        default:
          setErrorMessage(`Ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (!verificationCode) {
      setErrorMessage('Введите код подтверждения');
      setLoading(false);
      return;
    }

    try {
      console.log('Проверка кода подтверждения...');
      const userCredential = await confirmationResult.confirm(verificationCode);
      const newFirebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', newFirebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: '',
          createdAt: new Date().toISOString(),
        });
      }

      setFirebaseUser(newFirebaseUser);
      setShowCodeInput(false);
      setShowVerification(true);
    } catch (error) {
      console.error('Ошибка проверки кода:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-verification-code':
          setErrorMessage('Неверный код подтверждения.');
          break;
        case 'auth/code-expired':
          setErrorMessage('Код подтверждения истек. Попробуйте снова.');
          break;
        default:
          setErrorMessage(`Ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      console.log('Регистрация через Google...');
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
        <h1 className="register-title">
          {showVerification ? 'Подтверждение регистрации' : showCodeInput ? 'Введите код' : 'Регистрация'}
        </h1>
        <p className="register-subtitle">
          {showVerification || showCodeInput ? '' : 'Создайте аккаунт, чтобы оформить заказ'}
        </p>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {loading && <div className="spinner">Загрузка...</div>}
        <div id="recaptcha-container"></div>

        {!showVerification && !showCodeInput ? (
          <form className="register-form" onSubmit={handlePhoneSubmit}>
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
                placeholder="+996123456789"
                className="form-input5"
                value={formData.phone}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? 'Отправка...' : 'Получить код'}
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
        ) : showCodeInput ? (
          <form className="register-form" onSubmit={handleCodeSubmit}>
            <div className="form-group">
              <label htmlFor="code">Код подтверждения</label>
              <input
                type="text"
                id="code"
                name="code"
                placeholder="Введите код из SMS"
                className="form-input5"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? 'Проверка...' : 'Подтвердить код'}
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