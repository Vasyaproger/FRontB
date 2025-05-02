import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthContext } from './AuthContext';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: '',
    phone: '',
    address: '',
    email: '',
    boodaiCoins: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Загрузка данных профиля
  useEffect(() => {
    if (!user.isLoggedIn || !auth.currentUser) {
      console.log('Пользователь не авторизован, перенаправление на /login');
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        console.log('Загрузка профиля для UID:', auth.currentUser.uid);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          console.log('Данные профиля:', userDoc.data());
          setProfileData({
            ...userDoc.data(),
            email: auth.currentUser.email || userDoc.data().email,
          });
        } else {
          console.log('Документ пользователя не существует, создание нового');
          await setDoc(userDocRef, {
            firstName: '',
            phone: '',
            address: '',
            email: auth.currentUser.email,
            boodaiCoins: 0,
            createdAt: new Date().toISOString(),
          });
          setProfileData({
            firstName: '',
            phone: '',
            address: '',
            email: auth.currentUser.email,
            boodaiCoins: 0,
          });
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err.message);
        setError('Не удалось загрузить профиль: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  // Обработка изменения данных формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Реаутентификация пользователя
  const reauthenticateUser = async () => {
    try {
      console.log('Реаутентификация пользователя:', auth.currentUser.email);
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log('Реаутентификация успешна');
      return true;
    } catch (err) {
      console.error('Ошибка реаутентификации:', err.message);
      setError('Неверный текущий пароль');
      return false;
    }
  };

  // Обновление профиля
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Обновление профиля:', profileData);
      const userDocRef = doc(db, 'users', auth.currentUser.uid);

      // Обновление Firestore (имя, телефон, адрес)
      await updateDoc(userDocRef, {
        firstName: profileData.firstName || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });
      console.log('Firestore обновлён');

      // Обновление email (если изменился)
      if (profileData.email && profileData.email !== auth.currentUser.email) {
        const reauthenticated = await reauthenticateUser();
        if (!reauthenticated) {
          setLoading(false);
          return;
        }
        await updateEmail(auth.currentUser, profileData.email);
        await updateDoc(userDocRef, { email: profileData.email });
        console.log('Email обновлён');
      }

      // Обновление пароля (если указан)
      if (newPassword) {
        const reauthenticated = await reauthenticateUser();
        if (!reauthenticated) {
          setLoading(false);
          return;
        }
        await updatePassword(auth.currentUser, newPassword);
        console.log('Пароль обновлён');
      }

      setEditMode(false);
      setNewPassword('');
      setCurrentPassword('');
      alert('Профиль успешно обновлён!');
    } catch (err) {
      console.error('Ошибка обновления профиля:', err.message);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Этот email уже используется другим пользователем');
          break;
        case 'auth/invalid-email':
          setError('Некорректный формат email');
          break;
        case 'auth/weak-password':
          setError('Новый пароль слишком слабый (минимум 6 символов)');
          break;
        case 'auth/requires-recent-login':
          setError('Требуется повторный вход. Пожалуйста, войдите снова.');
          navigate('/login');
          break;
        default:
          setError('Ошибка обновления профиля: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-button" onClick={() => navigate('/')}>
          Назад
        </button>
        <h1 className="profile-title">Ваш профиль</h1>
        {error && <p className="profile-error">{error}</p>}
        {loading && <div className="profile-spinner">Загрузка...</div>}

        <div className="profile-card">
          {!editMode ? (
            <div className="profile-info">
              <p><strong>Имя:</strong> {profileData.firstName || 'Не указано'}</p>
              <p><strong>Телефон:</strong> {profileData.phone || 'Не указано'}</p>
              <p><strong>Email:</strong> {profileData.email || 'Не указано'}</p>
              <p><strong>Адрес:</strong> {profileData.address || 'Не указано'}</p>
              <p><strong>Boodai Coin:</strong> {profileData.boodaiCoins || 0}</p>
              <button
                className="profile-button"
                onClick={() => setEditMode(true)}
                disabled={loading}
              >
                Редактировать
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="firstName">Имя</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Адрес</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="currentPassword">Текущий пароль (для изменения email/пароля)</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  placeholder="Введите текущий пароль"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль (оставьте пустым, если не меняете)</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Введите новый пароль"
                  disabled={loading}
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="profile-button" disabled={loading}>
                  {loading ? <span className="button-spinner"></span> : 'Сохранить'}
                </button>
                <button
                  type="button"
                  className="profile-button cancel"
                  onClick={() => {
                    setEditMode(false);
                    setNewPassword('');
                    setCurrentPassword('');
                  }}
                  disabled={loading}
                >
                  {loading ? <span className="button-spinner"></span> : 'Отмена'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-card">
          <h2>Boodai Coin</h2>
          <p>Ваш баланс: <strong>{profileData.boodaiCoins || 0} монет</strong></p>
          <p>Используйте монеты для скидок на заказы!</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;