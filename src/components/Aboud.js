import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Aboud.css"; // Подключаем стили

const Aboud = () => {
  const navigate = useNavigate(); // Хук для навигации

  const handleClose = () => {
    navigate("/"); // Переход на главную страницу
  };

  return (
    <div className="about-container">
      <button onClick={handleClose} className="close-button">
        Закрыть
      </button>

      <div className="about-content">
        <h1 className="about-title">О нас</h1>
        <p className="about-text">
          Добро пожаловать в <strong>Boodai Pizza</strong> — место, где вкус и качество идут рука об руку. Наша цель — дарить вам незабываемые моменты за столом с самой вкусной пиццей и не только.
        </p>

        <p className="about-text">
          Мы тщательно подбираем ингредиенты и создаем блюда, которые могут удовлетворить любой вкус. От пиццы до пасты, от свежих салатов до десертов — у нас есть всё, что нужно для того, чтобы сделать ваш обед или ужин особенным.
        </p>

        <p className="about-text">
          В <strong>Boodai Pizza</strong> мы верим, что еда — это не только питание, но и способ создать атмосферу уюта и тепла. Наш ресторан — это не просто место для еды, а пространство для общения, отдыха и наслаждения каждым моментом.
        </p>

        <p className="about-text">
          Мы находимся в самом центре города, на <strong>Араванском шоссе</strong>, и всегда рады видеть вас у нас. Заходите, мы ждём вас с нетерпением!
        </p>
      </div>
    </div>
  );
};

export default Aboud;
