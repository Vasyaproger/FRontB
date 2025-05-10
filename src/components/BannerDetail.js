import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jpgPlaceholder from '../images/cat.jpg';
import '../styles/BannerDetail.css';

const BannerDetail = () => {
  const { bannerId } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [promoCode, setPromoCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Выносим fetchBanner на уровень компонента
  const fetchBanner = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://vasyaproger-backentboodai-543a.twc1.net/api/public/banners/${bannerId}`);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить баннер: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      setBanner(data);

      if (data.promo_code) {
        const expiresAt = data.promo_code.expires_at;
        if (expiresAt && new Date(expiresAt) < new Date()) {
          setIsExpired(true);
          setPromoCode(null);
        } else {
          setIsExpired(false);
          setPromoCode(data.promo_code);
        }
      } else if (data.promo_code_id) {
        try {
          const promoResponse = await fetch(`https://vasyaproger-backentboodai-543a.twc1.net/api/public/promo-codes/${data.promo_code_id}`);
          if (!promoResponse.ok) {
            console.error(`Failed to fetch promo code: ${promoResponse.status} - ${promoResponse.statusText}`);
            setPromoCode(null);
          } else {
            const promoData = await promoResponse.json();
            if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
              setIsExpired(true);
              setPromoCode(null);
            } else {
              setIsExpired(false);
              setPromoCode(promoData);
            }
          }
        } catch (promoError) {
          console.error('Error fetching promo code:', promoError.message);
          setPromoCode(null);
        }
      }
    } catch (err) {
      console.error('Error fetching banner:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, [bannerId]);

  const handleCopyPromoCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch((err) => {
      console.error('Failed to copy promo code:', err);
      alert('Не удалось скопировать промокод. Попробуйте снова.');
    });
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleRefreshPromo = () => {
    setLoading(true);
    setError(null);
    setIsExpired(false);
    fetchBanner(); // Теперь fetchBanner доступна
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}. <button onClick={handleRefreshPromo}>Обновить</button></div>;
  if (!banner) return <div className="error">Баннер не найден</div>;

  return (
    <div className="banner-detail-container">
      <button className="back-button" onClick={handleGoBack}>
        Назад
      </button>
      <h2 className="banner-title">{banner.title || 'Акция'}</h2>
      <div className="banner-image-wrapper">
        <img
          className="banner-image"
          src={banner.image || jpgPlaceholder}
          alt={banner.title || 'Акция'}
          onError={(e) => (e.target.src = jpgPlaceholder)}
        />
      </div>
      {banner.description && (
        <p className="banner-description">{banner.description}</p>
      )}
      <div className="promo-code-section">
        {promoCode ? (
          <>
            <h3 className="promo-code-title">Ваш промокод</h3>
            <div className="promo-code-box">
              <span className="promo-code">{promoCode.code}</span>
              <span className="promo-discount">
                Скидка: {promoCode.discount_percent}%
              </span>
              <button
                className="copy-button"
                onClick={() => handleCopyPromoCode(promoCode.code)}
                disabled={copied}
              >
                {copied ? 'Скопировано!' : 'Скопировать'}
              </button>
            </div>
          </>
        ) : isExpired ? (
          <p className="no-promo">Промокод истек. <button onClick={handleRefreshPromo}>Проверить снова</button></p>
        ) : (
          <p className="no-promo">Промокод для этой акции отсутствует</p>
        )}
      </div>
    </div>
  );
};

export default BannerDetail;