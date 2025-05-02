import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    isLoggedIn: false,
    name: '',
    balance: 0,
    firebaseUser: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          localStorage.setItem('userId', firebaseUser.uid);

          // Получение данных пользователя из Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};

          setUser({
            isLoggedIn: true,
            name: userData.firstName || firebaseUser.email.split('@')[0],
            balance: parseFloat(userData.balance || 0).toFixed(2),
            firebaseUser,
          });
        } catch (error) {
          console.error('Ошибка загрузки данных пользователя:', error.message);
          setUser({
            isLoggedIn: true,
            name: firebaseUser.email.split('@')[0],
            balance: '0.00',
            firebaseUser,
          });
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUser({ isLoggedIn: false, name: '', balance: 0, firebaseUser: null });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setUser({ isLoggedIn: false, name: '', balance: 0, firebaseUser: null });
    } catch (error) {
      console.error('Ошибка при выходе:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};