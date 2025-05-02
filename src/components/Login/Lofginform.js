import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthContext } from '../AuthContext';
import { auth, googleProvider, db } from '../firebase';
import './Lofginform.css';

function Lofginform() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const secretQuestion = 'Какой у вас сегодня день?';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const correctAnswer = today;

  useEffect(() => {
    if (user.isLoggedIn && !showVerification) {
      navigate('/');
    }
  }, [user, navigate, showVerification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Введите email и пароль');
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

      console.log('Вход пользователя...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName: '',
          lastName: '',
          phone: '',
          email: firebaseUser.email,
          createdAt: new Date().toISOString(),
        });
      }

      setEmail('');
      setPassword('');
      setShowVerification(true);
    } catch (error) {
      console.error('Ошибка входа:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-credential':
          setError('Неверный email или пароль. Проверьте данные или зарегистрируйтесь.');
          break;
        case 'auth/invalid-email':
          setError('Некорректный формат email.');
          break;
        case 'auth/too-many-requests':
          setError('Слишком много попыток. Попробуйте позже.');
          break;
        default:
          setError(`Ошибка входа: ${error.message}`);
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
        <h1 className="lf-title">{showVerification ? 'Подтверждение входа' : 'Вход'}</h1>
        <div className="lf-card">
          {error && <p className="lf-error">{error}</p>}
          {loading && <div className="lf-spinner">Загрузка...</div>}
          <div id="recaptcha-container"></div>

          {!showVerification ? (
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

          {!showVerification && (
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