import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import yandex from '../images/yandex.png';
import {
  FaWhatsapp,
  FaTelegram,
  FaInstagram,
  FaPhone,
  FaMapMarkerAlt,
  FaUserCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import { SiGooglemaps } from 'react-icons/si';
import logo from '../images/logo.png';
import '../styles/Nav.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Carousel from 'react-bootstrap/Carousel';
import jpgPlaceholder from '../images/cat.jpg';

const Nav = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const [index, setIndex] = useState(0);
  const [isInfoPopupVisible, setInfoPopupVisible] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [banners, setBanners] = useState([]);
  const [bannerError, setBannerError] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const navigate = useNavigate();

  const toggleInfoPopup = () => {
    setInfoPopupVisible(!isInfoPopupVisible);
    if (isPopupVisible) setPopupVisible(false);
  };

  const togglePopup = () => {
    setPopupVisible(!isPopupVisible);
  };

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка выхода:', error.message);
    }
  };

  const fetchBanners = useCallback(async () => {
    setBannerLoading(true);
    setBannerError(null);
    try {
      // Очищаем кэш перед запросом, чтобы получить свежие данные
      localStorage.removeItem('bannersCache');
      const url = `https://vasyaproger-backentboodai-543a.twc1.net/api/public/banners`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить баннеры: ${response.status}`);
      }
      const data = await response.json();
      const bannersData = Array.isArray(data) ? data : [];
      setBanners(bannersData);
      // Сохраняем в кэш
      localStorage.setItem('bannersCache', JSON.stringify({ data: bannersData, timestamp: Date.now() }));
    } catch (error) {
      console.error('Fetch banners error:', error.message);
      setBannerError('Не удалось загрузить баннеры. Попробуйте позже.');
    } finally {
      setBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleProfileClick = () => {
    navigate('/profile');
    setPopupVisible(false);
  };

  const handleBannerClick = (bannerId) => {
    navigate(`/banner/${bannerId}`);
  };

  const handleAboutClick = () => {
    console.log('Переход на страницу "О нас"');
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <>
      <nav className="navbar-container">
        <div className="navbar-wrapper">
          <div className="navbar-left">
            <div className="brand-container">
              <img className="pizza-logo" src={logo} alt="Logo" />
              <h1 className="brand-name">BOODAI PIZZA</h1>
            </div>
          </div>
          <div className="navbar-right">
            <div className="auth-buttons">
              <button className="info-btn" onClick={toggleInfoPopup}>
                <FaInfoCircle className="iuc" size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Banner section */}
        {bannerLoading && <div>Загрузка баннеров...</div>}
        {bannerError && <div className="error-message">{bannerError}</div>}
        {banners.length > 0 && !bannerLoading && !bannerError && (
          <div className="banner-section">
            <Carousel
              activeIndex={index}
              onSelect={handleSelect}
              interval={5000}
              controls={banners.length > 1}
              indicators={banners.length > 1}
            >
              {banners.map((banner) => (
                <Carousel.Item
                  key={banner.id}
                  onClick={() => handleBannerClick(banner.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    className="d-block w-100 Img_carusel"
                    src={banner.image || jpgPlaceholder}
                    alt={banner.title || 'Акция'}
                    onError={(e) => (e.target.src = jpgPlaceholder)}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        )}
      </nav>

      {isInfoPopupVisible && (
        <div className="popup-container show">
          <div className="popup-content">
            <div className="first_info">
              <div className="user-info_box">
                
                <button className="closE-btn" onClick={toggleInfoPopup}>
                  Закрыть
                </button>
              </div>
            </div>
            <h1 className="phone-number">+996 0998 064-064</h1>
            <div className="social-links">
              <div className="social-item">
                <a href="https://wa.me/996998064064" target="_blank" rel="noopener noreferrer">
                  <FaWhatsapp size={40} className="icon whatsapp" />
                  <span>WhatsApp</span>
                </a>
              </div>
              <div className="social-item">
                <a href="https://t.me/+zHkezRyvcX4xM2Ji" target="_blank" rel="noopener noreferrer">
                  <FaTelegram size={40} className="icon telegram" />
                  <span>Telegram</span>
                </a>
              </div>
              <div className="social-item">
                <a
                  href="https://www.instagram.com/boodai.pizza.osh?igsh=OGowdWJ6eDI2Zmxp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram size={40} className="icon instagram" />
                  <span>Instagram</span>
                </a>
              </div>
              <div className="social-item">
                <a href="tel:+996998064064">
                  <FaPhone size={40} className="icon phone" />
                  <span>Позвонить</span>
                </a>
              </div>
              <div className="social-item">
                <a href="https://yandex.ru/maps/-/CHUuiOlW" target="_blank" rel="noopener noreferrer">
                  <img src={yandex} alt="Яндекс.Карты" style={{ width: 40, height: 40 }} />
                  <span>Яндекс.Карты</span>
                </a>
              </div>
              <div className="social-item">
                <a href="https://maps.app.goo.gl/AyhZ5Htub8pwqgpK8" target="_blank" rel="noopener noreferrer">
                  <SiGooglemaps size={40} className="icon maps" />
                  <span>Google Maps</span>
                </a>
              </div>
              <div className="social-item">
                <a href="https://2gis.kg/bishkek/geo/70000001086696873" target="_blank" rel="noopener noreferrer">
                  <FaMapMarkerAlt size={40} className="icon maps" />
                  <span>2ГИС</span>
                </a>
              </div>
              <Link to="/about" onClick={handleAboutClick} className="about-link">
                О нас
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;