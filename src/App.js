import './App.css';
import React, { useState, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

import Loader from './components/Loader/Loader'; // Лоадер для отображения во время загрузки

// Динамическая загрузка компонентов
const Nav = React.lazy(() => import('./components/Nav'));
const Footer = React.lazy(() => import('./components/Footer'));
const Products = React.lazy(() => import('./components/Products'));
const Cart = React.lazy(() => import('./components/Cart'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const Adminlogin = React.lazy(() => import('./components/adminlogin/Adminlogin'));
const Aboud = React.lazy(() => import('./components/Aboud'));
const LoginForm = React.lazy(() => import('./components/Login/Lofginform'));
const Registerform = React.lazy(() => import('./components/Register/Registerform'));
const ConfirmCodePage = React.lazy(() => import('./components/ConfirmCodePage/ConfirmCodePage'));

// Компонент для проверки текущего пути
function NavWrapper({ children }) {
  const location = useLocation();
  const showNav = location.pathname === '/'; // Показывать Nav только на главной странице
  return (
    <>
      {showNav && (
        <Suspense fallback={<Loader />}>
          <Nav />
        </Suspense>
      )}
      {children}
    </>
  );
}

function App() {
  const userId = 1; // Замените на нужное значение
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  const updateCart = (id, quantity) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + quantity } : item))
        .filter((item) => item.quantity > 0); // Удаляем элементы с количеством 0
      return updatedItems;
    });
  };

  useEffect(() => {
    // Эмуляция загрузки данных
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Уменьшите время при необходимости

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />; // Показываем Loader, пока loading true
  }

  return (
    <Router>
      <NavWrapper>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Главная страница */}
            <Route
              path="/"
              element={
                <div>
                  <Products updateCart={updateCart} />
                  {/* <OrderPage cartItems={cartItems} updateCart={updateCart} />  */}
                  <Footer />
                  <Cart cartItems={cartItems} updateCart={updateCart} />
                </div>
              }
            />
            {/* Страницы Admin */}
            <Route path="/Admin" element={<Adminlogin userId={userId} />} />
            <Route path="/AdminPanel" element={<AdminPanel />} />
            {/* Страница "О нас" */}
            <Route path="/about" element={<Aboud />} />
            {/* Авторизация */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<Registerform />} />
            <Route path="/confirm-code" element={<ConfirmCodePage />} />
            {/* Перенаправление на главную */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </NavWrapper>
    </Router>
  );
}

export default App;
