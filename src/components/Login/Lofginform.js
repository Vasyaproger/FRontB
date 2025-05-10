import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPhoneNumber, signInWithPopup, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthContext } from '../AuthContext';
import { auth, googleProvider, db } from '../firebase';
import './Lofginform.css';

function Lofginform() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const secretQuestion = 'Какой у вас сегодня день?';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const correctAnswer = today;

  useEffect(() => {
    if (user.isLoggedIn && !showVerification && !showCodeInput) {
      navigate('/');
    }
  }, [user, navigate, showVerification, showCodeInput]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Введите номер телефона');
      return;
    }
    // Проверка формата номера телефона (например, +996123456789)
    const phoneRegex = /^\+\d{10,12}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Неверный формат номера телефона (например, +996123456789)');
      return;
    }
    setError('');
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

      console.log('Отправка SMS с кодом подтверждения...');
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(result);
      setShowCodeInput(true);
    } catch (error) {
      console.error('Ошибка отправки SMS:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-phone-number':
          setError('Неверный формат номера телефона.');
          break;
        case 'auth/too-many-requests':
          setError('Слишком много попыток. Попробуйте позже.');
          break;
        case 'auth/quota-exceeded':
          setError('Лимит SMS превышен. Попробуйте позже.');
          break;
        default:
          setError(`Ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Введите код подтверждения');
      return;
    }
    setError('');
    setLoading(true);

    try {
      console.log('Проверка кода подтверждения...');
      const userCredential = await confirmationResult.confirm(verificationCode);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName: '',
          lastName: '',
          phone: phoneNumber,
          email: '',
          createdAt: new Date().toISOString(),
        });
      }

      setPhoneNumber('');
      setVerificationCode('');
      setShowCodeInput(false);
      setShowVerification(true);
    } catch (error) {
      console.error('Ошибка проверки кода:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-verification-code':
          setError('Неверный код подтверждения.');
          break;
        case 'auth/code-expired':
          setError('Код подтверждения истек. Попробуйте снова.');
          break;
        default:
          setError(`Ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      console.log('Вход через Google...');
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName: firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : '',
          lastName: firebaseUser.displayName ? firebaseUser.displayName.split(' ')[1] || '' : '',
          phone: '',
          email: firebaseUser.email,
          createdAt: new Date().toISOString(),
        });
      }

      setShowVerification(true);
    } catch (error) {
      console.error('Ошибка входа через Google:', error.code, error.message);
      setError(`Ошибка входа через Google: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = () => {
    setError('');
    if (verificationAnswer.toLowerCase() === correctAnswer) {
      alert('Вход успешно подтвержден!');
      navigate('/');
    } else {
      setError(`Неверный ответ. Сегодня ${today}. Попробуйте снова.`);
    }
  };

  return (
    <div className="lf-background-container">
      <div className="lf-form-container">
        <button className="back-button" onClick={() => navigate('/')}>
          Назад
        </button>
        <h1 className="lf-title">
          {showVerification ? 'Подтверждение входа' : showCodeInput ? 'Введите код' : 'Вход'}
        </h1>
        <div className="lf-card">
          {error && <p className="lf-error">{error}</p>}
          {loading && <div className="lf-spinner">Загрузка...</div>}
          <div id="recaptcha-container"></div>

          {!showVerification && !showCodeInput ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="lf-form-group">
                <label className="lf-label" htmlFor="phone">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="lf-input-field"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="+996123456789"
                  disabled={loading}
                />
              </div>
              <div className="lf-button-group">
                <button type="submit" className="lf-button" disabled={loading}>
                  {loading ? 'Отправка...' : 'Получить код'}
                </button>
                <button
                  type="button"
                  className="lf-button google-button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  Войти через Google
                </button>
              </div>
            </form>
          ) : showCodeInput ? (
            <form onSubmit={handleCodeSubmit}>
              <div className="lf-form-group">
                <label className="lf-label" htmlFor="code">
                  Код подтверждения
                </label>
                <input
                  type="text"
                  id="code"
                  className="lf-input-field"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="Введите код из SMS"
                  disabled={loading}
                />
              </div>
              <button type="submit" className="lf-button" disabled={loading}>
                {loading ? 'Проверка...' : 'Подтвердить код'}
              </button>
            </form>
          ) : (
            <div className="verification-step">
              <p className="lf-label">{secretQuestion}</p>
              <div className="lf-form-group">
                <input
                  type="text"
                  placeholder="Введите ваш ответ"
                  className="lf-input-field"
                  value={verificationAnswer}
                  onChange={(e) => setVerificationAnswer(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <button
                className="lf-button"
                onClick={handleVerification}
                disabled={loading}
              >
                Подтвердить
              </button>
            </div>
          )}

          {!showVerification && !showCodeInput && (
            <div className="lf-register-link">
              <p>
                Нет аккаунта? <Link to="/register">Регистрация</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lofginform;