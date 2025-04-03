import React, { useEffect, useState } from 'react';
import './Loader.css';
import logo_site from './logo.png';

const Loader = () => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const onLoad = () => {
            setFadeOut(true);
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
            }, 300); // 300ms для плавного исчезновения
        };

        // Проверяем, работает ли приложение в режиме PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            // Если это PWA, не показываем загрузку
            document.getElementById('loader').style.display = 'none';
        } else {
            // Если не PWA, показываем обычную загрузку
            if (document.readyState === 'complete') {
                onLoad();
            } else {
                window.addEventListener('load', onLoad);
            }
        }

        return () => {
            window.removeEventListener('load', onLoad);
        };
    }, []);

    return (
        <div id="loader" className={`cafe-site-loader ${fadeOut ? 'cafe-site-fade-out' : ''}`}>
            <div className="cafe-site-loader-content">
                <div className="cafe-site-loader-spinner">
                    <img src={logo_site} alt="Логотип сайта" />
                </div>
                <h2>Загрузка, пожалуйста, подождите...</h2>
            </div>
        </div>
    );
};

export default Loader;
