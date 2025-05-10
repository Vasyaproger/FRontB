import React, { useState, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Loader from './components/Loader/Loader';
import './App.css';
import BannerDetail from './components/BannerDetail';

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

const Profile = React.lazy(() => import('./components/Profile'));

function NavWrapper({ children }) {
  const location = useLocation();
  // Не показываем Nav и Footer на /profile, /register, /login, /Admin, /AdminPanel
  const showNavAndFooter = !['/profile', '/register', '/login', '/Admin', '/AdminPanel'].includes(location.pathname);

  return (
    <>
      {showNavAndFooter && (
        <Suspense fallback={<Loader />}>
          <Nav />
        </Suspense>
      )}
      {children}
      {showNavAndFooter && (
        <Suspense fallback={<Loader />}>
          <Footer />
        </Suspense>
      )}
    </>
  );
}

function App() {
  const userId = 1;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const updateCart = (id, quantity) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + quantity } : item))
        .filter((item) => item.quantity > 0);
      return updatedItems;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <AuthProvider>
      <Router>
        <NavWrapper>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route
                path="/"
                element={
                  <div>
                    <Products updateCart={updateCart} />
                    <Cart cartItems={cartItems} updateCart={updateCart} />
                  </div>
                }
              />
              <Route path="/Admin" element={<Adminlogin userId={userId} />} />
              <Route path="/AdminPanel" element={<AdminPanel />} />
              <Route path="/about" element={<Aboud />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<Registerform />} />
              <Route path="/confirm-code" element={<ConfirmCodePage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
              <Route path="/banner/:bannerId" element={<BannerDetail />} />
            </Routes>
          </Suspense>
        </NavWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;