import React from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-logo">
          <h1>BOODAI PIZZA</h1>
          <p>Вкусная пицца, быстрая доставка!</p>
        </div>
        <div className="footer-links">
          <h3>Полезные ссылки</h3>
          <ul>
            <li><a href="#about">О нас</a></li>
            <li><a href="#menu">Меню</a></li>
            <li><a href="#contact">Контакты</a></li>
            <li><a href="#privacy-policy">Политика конфиденциальности</a></li>
            <li><a href="#terms-of-service">Условия использования</a></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h3>Контакты</h3>
          <p>Телефон: <a href="tel:+996998064064">+996 • 0 (998) 064-064</a></p>
          <p>Email: <a href="mailto:Beksultan2001t@gmail.com">Beksultan2001t@gmail.com</a></p>
        </div>
        <div className="footer-social">
          <h3>Мы в социальных сетях</h3>
          <div className="social-icons">
            <a href="#facebook"><FaFacebookF /></a>
            <a href="https://www.instagram.com/boodai.pizza.osh/profilecard/?igsh=OGowdWJ6eDI2Zmxp"><FaInstagram /></a>
            <a href="#twitter"><FaTwitter /></a>
            <a href="#linkedin"><FaLinkedinIn /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 BOODAI PIZZA. Все права защищены.</p>
        <p>Сайт разработан: <a href="https://github.com/Nukesul" target="_blank" rel="noopener noreferrer">Nursultan</a></p>
      </div>
    </footer>
  );
};

export default Footer;
