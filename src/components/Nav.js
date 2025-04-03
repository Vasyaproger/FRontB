import React, { useState, useEffect } from "react";
import yandex from "../images/yandex.png";
import {
  FaWhatsapp,
  FaTelegram,
  FaInstagram,
  FaPhone,
  FaMapMarkerAlt,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { SiGooglemaps } from "react-icons/si";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Nav.css";
import logo from "../images/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

import Carousel from "react-bootstrap/Carousel";

import dostavka from "../images/dostavka.jpg";
const Nav = () => {
  const [index, setIndex] = useState(0);
  const [isInfoPopupVisible, setInfoPopupVisible] = useState(false);

  const toggleInfoPopup = () => {
    setInfoPopupVisible(!isInfoPopupVisible);
  };
  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  const [isPopupVisible, setPopupVisible] = useState(false);
  const togglePopup = () => {
    setPopupVisible(!isPopupVisible);
  };

  const [user, setUser] = useState({
    isLoggedIn: false,
    name: "",
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false); // Объявляем состояние для меню
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        console.warn("Токен истек! Удаляем...");
        localStorage.removeItem("token");
        setUser({ isLoggedIn: false, name: "", balance: 0 });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          "https://nukesul-backend-1bde.twc1.net/api/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          if (res.status === 403) {
            console.warn("Ошибка 403: У пользователя нет доступа.");
            alert("У вас нет доступа к этой информации.");
          }
          throw new Error("Ошибка при получении данных пользователя.");
        }

        const data = await res.json();
        setUser({
          isLoggedIn: true,
          name: data.username,
          balance: parseFloat(data.balance).toFixed(2),
        });
      } catch (error) {
        console.error("Ошибка:", error.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLogout = () => {
    console.log("Вызов выхода из системы");
    localStorage.removeItem("token");
    setUser({ isLoggedIn: false, name: "", balance: 0 });
    navigate("/login");
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }
  const handleAboutClick = () => {
    console.log('Переход на страницу "О нас"');
  };

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
      </nav>
      {isInfoPopupVisible && (
        <div className="popup-container show">
          <div className="popup-content">
            <div className="first_info">
              <div className="user-info_box">
                {user.isLoggedIn ? (
                  <div className="user-info">
                    <FaUserCircle className="user-icon" onClick={togglePopup} />
                    <p>
                      <strong>Имя:</strong> {user.name}
                    </p>
                    {isPopupVisible && (
                      <div className="popup">
                        <button className="logout-btn" onClick={handleLogout}>
                          Выйти
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="auth-buttons">
                    <button
                      className="login-btn"
                      onClick={() => navigate("/login")}
                    >
                      Вход
                    </button>
                  </div>
                )}
                <button className="closE-btn" onClick={toggleInfoPopup}>
                  Закрыть
                </button>
              </div>
            </div>
            <h1 className="phone-number"> +996 0998 064-064</h1>
            <div className="social-links">
              <div className="social-item">
                <a
                  href="https://wa.me/996998064064"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp size={40} className="icon whatsapp" />
                  <span>WhatsApp</span>
                </a>
              </div>
              <div className="social-item">
                <a
                  href="https://t.me/+zHkezRyvcX4xM2Ji"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
                <a
                  href="https://yandex.ru/maps/-/CHUuiOlW"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={yandex}
                    alt="Яндекс.Карты"
                    style={{ width: 40, height: 40 }}
                  />
                  <span>Яндекс.Карты</span>
                </a>
              </div>

              <div className="social-item">
                <a
                  href="https://maps.app.goo.gl/AyhZ5Htub8pwqgpK8"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiGooglemaps size={40} className="icon maps" />
                  <span>Google Maps</span>
                </a>
              </div>
              <div className="social-item">
                <a
                  href="https://2gis.kg/bishkek/geo/70000001086696873"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaMapMarkerAlt size={40} className="icon maps" />
                  <span>2ГИС</span>
                </a>
              </div>
              <Link
                to="/about"
                onClick={handleAboutClick}
                className="about-link"
              >
                О нас
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Основные ссылки для ПК */}
      <div className="navbar-links-container">
        <Carousel activeIndex={index} onSelect={handleSelect}>
          <Carousel.Item>
            <img className="Img_carusel" src={dostavka} text="First slide" />
          </Carousel.Item>
          <Carousel.Item>
            <img className="Img_carusel" src={dostavka} text="First slide" />
          </Carousel.Item>
          <Carousel.Item>
            <img className="Img_carusel" src={dostavka} text="First slide" />
          </Carousel.Item>
        </Carousel>
      </div>

    </>
  );
};

export default Nav;
