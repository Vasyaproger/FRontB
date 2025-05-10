import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, getDocs, query, where, collection, addDoc } from 'firebase/firestore';
import { auth, db, storage } from './firebase';
import { AuthContext } from './AuthContext';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    avatar: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [giftEmail, setGiftEmail] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // Форматирование числа без лишних нулей
  const formatCoins = (num) => {
    return Number(num.toFixed(2)).toString();
  };

  // Автоматическое скрытие уведомлений
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Загрузка данных профиля и транзакций
  useEffect(() => {
    if (!user.isLoggedIn || !auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfileData({
            ...userDoc.data(),
            email: auth.currentUser.email || userDoc.data().email,
          });
        } else {
          await setDoc(userDocRef, {
            firstName: '',
            phone: '',
            address: '',
            email: auth.currentUser.email,
            boodaiCoins: 0,
            avatar: '',
            createdAt: new Date().toISOString(),
          });
          setProfileData({
            firstName: '',
            phone: '',
            address: '',
            email: auth.currentUser.email,
            boodaiCoins: 0,
            avatar: '',
          });
        }

        // Загрузка транзакций
        const transactionsRef = collection(db, 'transactions');
        const q = query(transactionsRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const transactionList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        }));
        setTransactions(transactionList.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        setError('Не удалось загрузить данные: ' + err.message);
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

  // Загрузка аватара
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (максимум 5МБ)');
      return;
    }

    setAvatarFile(file);
    setLoading(true);

    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { avatar: downloadURL });
      setProfileData((prev) => ({ ...prev, avatar: downloadURL }));
      setSuccess('Аватар успешно обновлён!');
    } catch (err) {
      setError('Ошибка загрузки аватара: ' + err.message);
    } finally {
      setLoading(false);
      setAvatarFile(null);
      fileInputRef.current.value = '';
    }
  };

  // Реаутентификация пользователя
  const reauthenticateUser = async () => {
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      return true;
    } catch (err) {
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
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        firstName: profileData.firstName || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });

      if (profileData.email && profileData.email !== auth.currentUser.email) {
        const reauthenticated = await reauthenticateUser();
        if (!reauthenticated) {
          setLoading(false);
          return;
        }
        await updateEmail(auth.currentUser, profileData.email);
        await updateDoc(userDocRef, { email: profileData.email });
      }

      if (newPassword) {
        const reauthenticated = await reauthenticateUser();
        if (!reauthenticated) {
          setLoading(false);
          return;
        }
        await updatePassword(auth.currentUser, newPassword);
      }

      setEditMode(false);
      setNewPassword('');
      setCurrentPassword('');
      setSuccess('Профиль успешно обновлён!');
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Этот email уже используется');
          break;
        case 'auth/invalid-email':
          setError('Некорректный email');
          break;
        case 'auth/weak-password':
          setError('Пароль слишком слабый (минимум 6 символов)');
          break;
        case 'auth/requires-recent-login':
          setError('Требуется повторный вход');
          navigate('/login');
          break;
        default:
          setError('Ошибка: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Дарение монет
  const handleGiftCoins = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const amount = parseFloat(giftAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Введите корректное количество монет');
      }
      if (amount > profileData.boodaiCoins) {
        throw new Error('Недостаточно монет для дарения');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', giftEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Пользователь с таким email не найден');
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientData = recipientDoc.data();
      const recipientRef = doc(db, 'users', recipientDoc.id);
      const senderRef = doc(db, 'users', auth.currentUser.uid);

      // Обновление балансов
      await updateDoc(recipientRef, {
        boodaiCoins: (recipientData.boodaiCoins || 0) + amount,
      });
      await updateDoc(senderRef, {
        boodaiCoins: profileData.boodaiCoins - amount,
      });

      // Запись транзакций
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        type: 'sent',
        amount,
        to: giftEmail,
        timestamp: new Date(),
      });
      await addDoc(collection(db, 'transactions'), {
        userId: recipientDoc.id,
        type: 'received',
        amount,
        from: auth.currentUser.email,
        timestamp: new Date(),
      });

      setProfileData((prev) => ({
        ...prev,
        boodaiCoins: prev.boodaiCoins - amount,
      }));
      setTransactions((prev) => [{
        id: Date.now(),
        type: 'sent',
        amount,
        to: giftEmail,
        timestamp: new Date(),
      }, ...prev]);
      setGiftEmail('');
      setGiftAmount('');
      setSuccess(`Успешно подарено ${formatCoins(amount)} монет!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <span className="back-icon">←</span> Назад
        </button>
        <h1 className="profile-title">Ваш профиль</h1>
        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">{success}</p>}
        {loading && <div className="profile-spinner">Загрузка...</div>}

        <div className="profile-card avatar-section">
          <div className="avatar-container">
            <img
              src={profileData.avatar || 'https://via.placeholder.com/150'}
              alt="Avatar"
              className="avatar-image"
            />
            {editMode && (
              <div className="avatar-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                  className="avatar-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="avatar-button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}
                >
                  {avatarFile ? 'Загружается...' : 'Изменить аватар'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-card">
          {!editMode ? (
            <div className="profile-info">
              <p><strong>Имя:</strong> {profileData.firstName || 'Не указано'}</p>
              <p><strong>Телефон:</strong> {profileData.phone || 'Не указано'}</p>
              <p><strong>Email:</strong> {profileData.email || 'Не указано'}</p>
              <p><strong>Адрес:</strong> {profileData.address || 'Не указано'}</p>
              <p><strong>Boodai Coin:</strong> 
                <span className="coin-balance">{formatCoins(profileData.boodaiCoins)} монет</span>
                <div className="coin-progress">
                  <div 
                    className="coin-progress-bar" 
                    style={{ width: `${Math.min(profileData.boodaiCoins / 1000 * 100, 100)}%` }}
                  ></div>
                </div>
              </p>
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
                <label htmlFor="currentPassword">Текущий пароль</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  placeholder="Для изменения email/пароля"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Оставьте пустым, если не меняете"
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
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-card">
          <h2 className="section-title">Boodai Coin</h2>
          <p>Ваш баланс: <strong className="coin-balance">{formatCoins(profileData.boodaiCoins)} монет</strong></p>
          <p>Используйте монеты для скидок или подарите их друзьям!</p>
          <form onSubmit={handleGiftCoins} className="gift-form">
            <div className="form-group">
              <label htmlFor="giftEmail">Email получателя</label>
              <input
                type="email"
                id="giftEmail"
                value={giftEmail}
                onChange={(e) => setGiftEmail(e.target.value)}
                className="form-input"
                placeholder="Введите email"
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="giftAmount">Количество монет</label>
              <input
                type="number"
                id="giftAmount"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                className="form-input"
                placeholder="Введите сумму"
                min="0.01"
                step="0.01"
                disabled={loading}
                required
              />
            </div>
            <button type="submit" className="profile-button gift" disabled={loading}>
              {loading ? <span className="button-spinner"></span> : 'Подарить'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h2 className="section-title">История транзакций</h2>
          {transactions.length === 0 ? (
            <p className="no-transactions">Транзакции отсутствуют</p>
          ) : (
            <div className="transactions-list">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-icon">
                    {transaction.type === 'sent' ? '↗' : '↙'}
                  </div>
                  <div className="transaction-details">
                    <p>
                      {transaction.type === 'sent' 
                        ? `Отправлено ${formatCoins(transaction.amount)} монет на ${transaction.to}`
                        : `Получено ${formatCoins(transaction.amount)} монет от ${transaction.from}`}
                    </p>
                    <p className="transaction-date">
                      {transaction.timestamp.toLocaleDateString()} {transaction.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;