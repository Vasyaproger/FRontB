/* Нормализация стилей для кросс-браузерности (Google-подход) */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Переменные в стиле Google Material Design */
:root {
  /* Цвета (Додо Пицца + Google Material) */
  --primary-color: #ff6f00;      /* Оранжевый акцент */
  --secondary-color: #1a1a1a;     /* Темно-серый текст */
  --accent-color: #00c4b4;        /* Бирюзовый акцент */
  --background-white: #ffffff;    /* Чистый белый фон */
  --surface-light: #f8f9fa;       /* Нейтральный фон (Google) */
  --text-dark: #1a1a1a;          /* Темный текст */
  --text-light: #ffffff;         /* Светлый текст */
  --text-muted: #5f6368;         /* Приглушенный текст (Google) */
  --focus-ring: rgba(255, 111, 0, 0.2); /* Фокус */
  --error-color: #d93025;        /* Ошибки (Google) */
  --disabled-color: #dadce0;     /* Отключенные элементы */
  --gradient-primary: linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%);
  --gradient-subtle: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);

  /* Тени */
  --shadow-light: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 4px 8px rgba(0, 0, 0, 0.12);
  --shadow-deep: 0 8px 16px rgba(0, 0, 0, 0.16);

  /* Радиусы */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px; /* Мягкость Google */

  /* Отступы и анимации */
  --spacing-unit: 1rem;
  --max-width: 1280px;
  --transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); /* Material easing */
  --transition-fast: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
  --spring-easing: cubic-bezier(0.55, 0.0, 0.1, 1.5); /* Эластичность */

  /* Типографика (Google Roboto) */
  --font-family: "Roboto", "Inter", system-ui, -apple-system, sans-serif;
  --font-size-base: 16px;

  /* Glass эффект */
  --glass-bg: rgba(255, 255, 255, 0.9);
  --glass-blur: blur(12px);
}

/* Базовые стили */
body {
  background: var(--gradient-subtle);
  color: var(--text-dark);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.6;
  overflow-x: hidden;
  scroll-behavior: smooth;
  touch-action: manipulation;
}

.menu-wrapper {
  position: relative;
  min-height: 100vh;
}

/* Утилиты */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-unit);
}

/* Glass эффект */
.glass-effect {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-light);
  border-radius: var(--radius-md);
  transition: transform var(--transition), box-shadow var(--transition);
}

.glass-effect:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

/* Загрузчик */
.loader {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--primary-color);
  font-size: 1.25rem;
  animation: spin 1s linear infinite;
  will-change: transform;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Ошибки */
.error-message, .error {
  text-align: center;
  color: var(--error-color);
  padding: var(--spacing-unit);
  font-weight: 500;
  background: rgba(217, 48, 37, 0.1);
  border-radius: var(--radius-sm);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Шапка */
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: calc(var(--spacing-unit) * 0.75);
  background: var(--background-white);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  max-width: var(--max-width);
  margin: 0 auto;
}

/* Поиск */
.search-bar {
  display: flex;
  align-items: center;
  background: var(--surface-light);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 24rem;
  box-shadow: var(--shadow-light);
  transition: box-shadow var(--transition);
}

.search-bar:hover, .search-bar:focus-within {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  color: var(--text-dark);
  appearance: none;
}

.search-bar input:focus {
  outline: none;
}

.search-icon {
  color: var(--text-muted);
  margin: 0 0.75rem;
  font-size: 1.125rem;
  transition: color var(--transition), transform var(--transition-fast);
}

.search-bar:hover .search-icon, .search-bar:focus-within .search-icon {
  color: var(--primary-color);
  transform: scale(1.1);
}

/* Информация о филиале */
.branch-info {
  text-align: center;
  margin: calc(var(--spacing-unit) * 1.5) 0;
}

.branch-info span {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--surface-light);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background var(--transition), color var(--transition);
}

.branch-info span:hover {
  background: var(--gradient-primary);
  color: var(--text-light);
}

.dropdown-icon {
  cursor: pointer;
  font-size: 1.125rem;
  transition: color var(--transition), transform var(--transition-fast);
}

.branch-info span:hover .dropdown-icon {
  color: var(--text-light);
  transform: rotate(180deg);
}

/* Навигация меню */
.menu-nav {
  padding: 0.75rem 0;
  z-index: 1000;
}

.menu-nav ul {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  overflow-x: auto;
  white-space: nowrap;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.menu-nav ul::-webkit-scrollbar {
  display: none;
}

.menu-nav li {
  list-style: none;
}

.menu-nav a {
  display: inline-block;
  padding: 0.625rem 1.5rem;
  background: var(--surface-light);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-dark);
  font-weight: 500;
  font-size: 0.9375rem;
  transition: background var(--transition), color var(--transition), transform var(--transition-fast);
  text-align: center;
  min-width: 5rem;
  box-shadow: var(--shadow-light);
}

.menu-nav a:hover, .menu-nav a.active {
  background: var(--gradient-primary);
  color: var(--text-light);
  transform: scale(1.05);
}

/* Секция сторис */
.stories-section h2 {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  font-weight: 500;
  text-align: center;
  margin: calc(var(--spacing-unit) * 1.5) 0;
  color: var(--text-dark);
}

.stories-list {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: var(--spacing-unit);
  scroll-snap-type: x mandatory;
}

.story-card {
  flex: 0 0 5rem;
  text-align: center;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.story-card:hover {
  transform: scale(1.1) translateY(-0.25rem);
}

.story-card.viewed .story-image {
  opacity: 0.7;
  filter: grayscale(50%);
}

.story-image {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color);
  transition: border-color var(--transition), opacity 0.3s ease;
  opacity: 0;
  aspect-ratio: 1/1;
  loading: lazy;
}

.story-image.loaded {
  opacity: 1;
}

.story-card:hover .story-image {
  border-color: var(--accent-color);
}

.story-card p {
  font-size: 0.75rem;
  margin-top: 0.375rem;
  color: var(--text-muted);
}

/* Модальное окно сторис */
.story-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: grid;
  place-items: center;
}

.story-modal.open {
  animation: fadeIn 0.3s ease forwards;
}

.story-modal.close {
  animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.story-content {
  width: 90%;
  max-width: 32rem;
  position: relative;
  transform: translateY(-50%);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.story-content.open {
  animation: slideUpModal 0.3s ease forwards;
}

.story-content.close {
  animation: slideDownModal 0.3s ease forwards;
}

@keyframes slideUpModal {
  from { opacity: 0; transform: translateY(-30%); }
  to { opacity: 1; transform: translateY(-50%); }
}

@keyframes slideDownModal {
  from { opacity: 1; transform: translateY(-50%); }
  to { opacity: 0; transform: translateY(-30%); }
}

.story-progress {
  display: flex;
  gap: 0.375rem;
  padding: var(--spacing-unit);
}

.progress-bar {
  flex: 1;
  height: 0.25rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.05s linear;
}

.story-image-full {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 0.75rem;
  transition: opacity 0.3s ease;
  opacity: 0;
  loading: lazy;
}

.story-image-full.loaded {
  opacity: 1;
}

.close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--gradient-primary);
  color: var(--text-light);
  border: none;
  border-radius: 50%;
  width: 2.25rem;
  height: 2.25rem;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
  appearance: none;
}

.close-modal:hover {
  transform: scale(1.1) rotate(90deg);
}

.close-modal:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

/* Фильтры */
.filters-section {
  margin: calc(var(--spacing-unit) * 1.5) 0;
}

.filters-section h3 {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--text-dark);
}

.filter-options {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-options select {
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--disabled-color);
  flex: 1;
  min-width: 9rem;
  background: var(--background-white);
  font-size: 0.9375rem;
  transition: border-color var(--transition), box-shadow var(--transition);
  appearance: none;
}

.filter-options select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

/* Продукты */
.section-title {
  font-size: clamp(1.5rem, 4vw, 1.75rem);
  font-weight: 500;
  text-align: center;
  margin: calc(var(--spacing-unit) * 2) 0;
  color: var(--text-dark);
  position: relative;
}

.section-title::after {
  content: '';
  width: 3.5rem;
  height: 0.25rem;
  background: var(--gradient-primary);
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
}

.best-sellers, .menu-products {
  display: grid;
  gap: calc(var(--spacing-unit) * 1.25);
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.best-seller-product, .menu-product {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: var(--spacing-unit);
  background: var(--background-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-light);
  transition: transform var(--transition), box-shadow var(--transition);
  animation: slideUp 0.4s ease forwards;
  cursor: pointer;
  will-change: transform;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.best-seller-product:hover, .menu-product:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.best-seller-image, .menu-product-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  transition: transform var(--transition-fast), opacity 0.4s ease;
  opacity: 0;
  aspect-ratio: 1/1;
  loading: lazy;
  image-rendering: optimizeQuality;
}

.best-seller-image.loaded, .menu-product-image.loaded {
  opacity: 1;
}

.best-seller-product:hover .best-seller-image,
.menu-product:hover .menu-product-image {
  transform: scale(1.05);
}

.best-seller-product h3, .menu-product h3 {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  color: var(--text-dark);
  font-variation-settings: "wght" 500;
}

.menu-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.menu-product p:first-of-type {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0.375rem 0;
}

.best-seller-product p, .menu-product p:last-of-type {
  font-size: 0.9375rem;
  color: var(--primary-color);
  font-weight: 500;
}

.add-btn {
  padding: 0.625rem;
  background: var(--gradient-primary);
  color: var(--text-light);
  border: none;
  border-radius: 1.25rem;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
  appearance: none;
  position: relative;
  overflow: hidden;
}

.add-btn:hover {
  transform: scale(1.1);
}

.add-btn:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.add-btn::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.add-btn:hover::after {
  width: 200%;
  height: 200%;
}

/* Halal блок */
.halal-box {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1.25);
  padding: var(--spacing-unit);
  margin: calc(var(--spacing-unit) * 1.5) auto;
  max-width: 22rem;
  transition: transform var(--transition);
}

.halal-box:hover {
  transform: scale(1.02);
}

.halal-img {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: 0;
  loading: lazy;
}

.halal-img.loaded {
  opacity: 1;
}

.halal-box h1 {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-dark);
}

.halal-box p {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* Категории меню */
.menu-category {
  margin-bottom: calc(var(--spacing-unit) * 2);
  padding-bottom: calc(var(--spacing-unit) * 2);
  border-bottom: 1px solid var(--disabled-color);
}

.menu-category h2 {
  font-size: 1.5rem;
  font-weight: 500;
  text-align: center;
  color: var(--text-dark);
  position: relative;
}

.menu-category h2::after {
  content: '';
  width: 2.5rem;
  height: 0.15rem;
  background: var(--accent-color);
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
}

/* История заказов */
.history-items {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 1.25);
}

.history-item {
  padding: var(--spacing-unit);
  background: var(--background-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-light);
  transition: transform var(--transition), background var(--transition);
  animation: slideUp 0.4s ease forwards;
}

.history-item:hover {
  background: var(--surface-light);
  transform: translateY(-2px);
}

.history-item p {
  margin: 0.375rem 0;
  font-size: 0.8125rem;
}

/* Модальное окно (Google Material Design) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
  will-change: opacity;
}

.modal-overlay.open {
  opacity: 1;
}

.modal-overlay.close {
  opacity: 0;
}

.modal-content {
  padding: calc(var(--spacing-unit) * 2);
  max-width: 48rem;
  width: 90%;
  max-height: 95vh;
  overflow-y: auto;
  background: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-deep);
  transform: scale(0.9);
  opacity: 0;
  transition: transform 0.3s var(--spring-easing), opacity 0.3s ease;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 10000;
  will-change: transform, opacity;
}

.modal-content.open {
  transform: scale(1);
  opacity: 1;
}

.modal-content.close {
  transform: scale(0.9);
  opacity: 0;
}

.modal-title {
  font-size: clamp(1.5rem, 4vw, 1.75rem);
  font-weight: 500;
  margin-bottom: calc(var(--spacing-unit) * 1.5);
  color: var(--text-dark);
  text-align: center;
  font-variation-settings: "wght" 500;
}

.close-modal-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast), border-color var(--transition), color var(--transition);
  appearance: none;
  position: relative;
  overflow: hidden;
}

.close-modal-button svg {
  width: 1.5rem;
  height: 1.5rem;
  fill: currentColor;
}

.close-modal-button:hover {
  transform: scale(1.1);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.close-modal-button:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.close-modal-button::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 111, 0, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.close-modal-button:hover::after {
  width: 200%;
  height: 200%;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 1.5);
}

.modal-image {
  width: 100%;
  max-width: 100%;
  max-height: 34rem;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-light);
  transition: transform 0.3s ease, opacity 0.4s ease;
  opacity: 0;
  loading: eager;
  aspect-ratio: 4/3;
  image-rendering: optimizeQuality;
}

.modal-image.loaded {
  opacity: 1;
}

.modal-image:hover {
  transform: scale(1.02);
}

.modal-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.modal-info h1 {
  font-size: clamp(1.75rem, 4vw, 2rem);
  font-weight: 500;
  color: var(--text-dark);
  margin: 0;
  font-variation-settings: "wght" 500;
}

.modal-info p {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.variant-selection {
  margin: calc(var(--spacing-unit) * 1.5) 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variant-selection h3 {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.variant-btn {
  padding: 1rem 2rem;
  background: var(--surface-light);
  border: 1px solid var(--disabled-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-dark);
  transition: background var(--transition), color var(--transition), transform var(--transition-fast), box-shadow var(--transition);
  appearance: none;
  position: relative;
  overflow: hidden;
}

.variant-btn:hover {
  background: var(--gradient-primary);
  color: var(--text-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.variant-btn.selected {
  background: var(--gradient-primary);
  color: var(--text-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.variant-btn:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.variant-btn::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.variant-btn:hover::after {
  width: 200%;
  height: 200%;
}

.add-to-cart-btn {
  padding: 1.5rem 2.5rem;
  background: var(--gradient-primary);
  color: var(--text-light);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  transition: transform var(--transition-fast), box-shadow var(--transition);
  appearance: none;
  margin-top: calc(var(--spacing-unit) * 1.5);
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.add-to-cart-btn:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.add-to-cart-btn::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.add-to-cart-btn:hover::after {
  width: 200%;
  height: 200%;
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.branch-item {
  padding: calc(var(--spacing-unit) * 1.25);
  background: var(--surface-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition), color var(--transition), transform var(--transition-fast);
}

.branch-item:hover, .branch-item.selected {
  background: var(--gradient-primary);
  color: var(--text-light);
  transform: translateY(-2px);
}

.branch-name {
  font-size: 1rem;
  font-weight: 500;
}

.branch-address {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.branch-item.selected .branch-address, .branch-item:hover .branch-address {
  color: var(--text-light);
}

/* Корзина */
.cart-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: clamp(20rem, 50%, 28rem);
  height: 100%;
  z-index: 1000;
  padding: calc(var(--spacing-unit) * 1.5);
  overflow-y: auto;
  background: var(--background-white);
  box-shadow: var(--shadow-deep);
}

.cart-panel.open {
  animation: slideInRight 0.3s ease forwards;
}

.cart-panel.close {
  animation: slideOutRight 0.3s ease forwards;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideOutRight {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

.empty-cart {
  text-align: center;
  padding: calc(var(--spacing-unit) * 2);
}

.cart-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: calc(var(--spacing-unit) * 1.5);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--surface-light);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: background var(--transition), color var(--transition), transform var(--transition-fast);
  appearance: none;
  position: relative;
  overflow: hidden;
}

.tab-btn.active, .tab-btn:hover {
  background: var(--gradient-primary);
  color: var(--text-light);
  transform: scale(1.03);
}

.tab-btn:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.tab-btn::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.tab-btn:hover::after {
  width: 200%;
  height: 200%;
}

.cart-items {
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 1.25);
}

.cart-item {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-unit) * 1.25);
  padding: var(--spacing-unit);
  background: var(--background-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-light);
  transition: background var(--transition);
  animation: slideUp 0.4s ease forwards;
}

.cart-item:hover {
  background: var(--surface-light);
}

.cart-item-image {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: contain;
  border-radius: var(--radius-sm);
  transition: opacity 0.4s ease;
  opacity: 0;
  loading: lazy;
  image-rendering: optimizeQuality;
}

.cart-item-image.loaded {
  opacity: 1;
}

.cart-item-info {
  flex: 1;
}

.cart-item-info h3 {
  font-size: 1rem;
  margin: 0;
  color: var(--text-dark);
}

.original-price {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 0.8125rem;
  margin-right: 0.5rem;
}

.discounted-price {
  color: var(--error-color);
  font-weight: bold;
}

.cart-item-info p {
  font-size: 0.9375rem;
  color: var(--primary-color);
  font-weight: 500;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-controls button {
  width: 2.25rem;
  height: 2.25rem;
  background: var(--gradient-primary);
  color: var(--text-light);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-fast);
  appearance: none;
}

.quantity-controls button:hover {
  transform: scale(1.1);
}

.quantity-controls button:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.quantity-controls span {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-dark);
}

.cart-footer {
  padding: calc(var(--spacing-unit) * 1.5);
}

.total {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: calc(var(--spacing-unit) * 1.5);
  color: var(--text-dark);
}

.original-total {
  text-decoration: line-through;
  color: var(--text-muted);
  margin-right: 0.75rem;
  font-size: 0.9375rem;
}

.promo-section {
  display: flex;
  gap: 0.75rem;
  margin-bottom: calc(var(--spacing-unit) * 1.5);
}

.promo-section input {
  flex: 1;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--disabled-color);
  background: var(--background-white);
  font-size: 0.9375rem;
  transition: border-color var(--transition), box-shadow var(--transition);
  appearance: none;
}

.promo-section input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.promo-section button {
  padding: 0.75rem 1.25rem;
  background: var(--gradient-primary);
  color: var(--text-light);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: transform var(--transition-fast);
  appearance: none;
  position: relative;
  overflow: hidden;
}

.promo-section button:hover {
  transform: scale(1.05);
}

.promo-section button:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.promo-section button::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.promo-section button:hover::after {
  width: 200%;
  height: 200%;
}

.order-form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 1);
}

.order-form input, .order-form textarea {
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--disabled-color);
  background: var(--background-white);
  font-size: 0.9375rem;
  transition: border-color var(--transition), box-shadow var(--transition);
  appearance: none;
}

.order-form input:focus, .order-form textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.order-form textarea {
  min-height: 6rem;
  resize: vertical;
}

.submit-btn, .close-cart-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: transform var(--transition-fast);
  appearance: none;
}

.submit-btn {
  background: var(--gradient-primary);
  color: var(--text-light);
  position: relative;
  overflow: hidden;
}

.submit-btn:hover {
  transform: scale(1.05);
}

.submit-btn:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.submit-btn::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.submit-btn:hover::after {
  width: 200%;
  height: 200%;
}

.close-cart-btn {
  background: var(--surface-light);
}

.close-cart-btn:hover {
  background: var(--disabled-color);
  transform: scale(1.03);
}

.close-cart-btn:focus {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.order-confirmation {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  z-index: 1001;
  background: var(--gradient-primary);
  color: var(--text-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
  font-size: 1rem;
  font-weight: 500;
  animation: slideUpNotification 0.3s ease forwards;
}

@keyframes slideUpNotification {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Дополнительные улучшения UX/UI */
button:not(:disabled) {
  position: relative;
  overflow: hidden;
}

button:not(:disabled)::after {
  content: '';
  position: absolute;
  top: var(--ripple-y);
  left: var(--ripple-x);
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

button:not(:disabled):hover::after {
  width: 200%;
  height: 200%;
}

button:focus, input:focus, select:focus, textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}

button:disabled {
  background: var(--disabled-color) !important;
  cursor: not-allowed;
  transform: none !important;
}

.title_prod {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

img {
  display: block;
  width: 100%;
  height: auto;
}

.fade-in {
  animation: fadeIn 0.4s ease forwards;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

* {
  scrollbar-width: none;
}

/* Поддержка Retina */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .modal-image,
  .best-seller-image,
  .menu-product-image,
  .cart-item-image,
  .halal-img,
  .story-image {
    image-rendering: optimizeQuality;
  }
}

/* Уменьшение анимаций для слабых устройств */
@media (prefers-reduced-motion: reduce) {
  .glass-effect, .story-card, .best-seller-product, .menu-product, .cart-panel, .modal-content, button {
    transition: none;
    animation: none;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  :root {
    --spacing-unit: 0.75rem;
    --radius-md: 12px;
    --radius-sm: 6px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-bar {
    max-width: 100%;
    padding: 0.5rem;
  }

  .search-bar input {
    font-size: 0.875rem;
    padding: 0.5rem;
  }

  .menu-nav ul {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .menu-nav a {
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    min-width: 4.5rem;
  }

  .stories-list {
    gap: 0.75rem;
  }

  .story-card {
    flex: 0 0 4.5rem;
  }

  .story-image {
    width: 3.5rem;
    height: 3.5rem;
  }

  .best-sellers, .menu-products {
    grid-template-columns: 1fr;
  }

  .best-seller-image, .menu-product-image {
    width: 100px;
    height: 100px;
  }

  .cart-panel {
    width: 100%;
  }

  .modal-content {
    width: 95%;
    padding: calc(var(--spacing-unit) * 2);
  }

  .modal-image {
    max-height: 26rem;
  }

  .modal-info h1 {
    font-size: 1.5rem;
  }

  .variant-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }

  .add-to-cart-btn {
    padding: 1.25rem 2rem;
    font-size: 1rem;
  }

  .close-modal-button {
    width: 2.75rem;
    height: 2.75rem;
  }
}

@media (max-width: 480px) {
  :root {
    --spacing-unit: 0.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .menu-category h2 {
    font-size: 1.25rem;
  }

  .best-seller-image, .menu-product-image {
    width: 90px;
    height: 90px;
  }

  .best-seller-product h3, .menu-product h3 {
    font-size: 0.9375rem;
  }

  .menu-product p:first-of-type {
    font-size: 0.75rem;
  }

  .menu-product p:last-of-type {
    font-size: 0.875rem;
  }

  .add-btn {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 0.75rem;
  }

  .search-bar {
    padding: 0.375rem;
  }

  .menu-nav a {
    padding: 0.375rem 1rem;
    font-size: 0.8125rem;
    min-width: 4rem;
  }

  .story-card {
    flex: 0 0 4rem;
  }

  .story-image {
    width: 3rem;
    height: 3rem;
  }

  .story-card p {
    font-size: 0.6875rem;
  }

  .filters-section h3 {
    font-size: 1rem;
  }

  .filter-options select {
    font-size: 0.875rem;
    padding: 0.5rem;
    min-width: 8rem;
  }

  .modal-content {
    padding: calc(var(--spacing-unit) * 1.5);
  }

  .modal-image {
    max-height: 22rem;
  }

  .modal-info h1 {
    font-size: 1.25rem;
  }

  .modal-info p {
    font-size: 0.875rem;
  }

  .variant-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.8125rem;
  }

  .add-to-cart-btn {
    padding: 1rem 1.75rem;
    font-size: 0.9375rem;
  }

  .cart-item-image {
    width: 3.5rem;
    height: 3.5rem;
  }

  .cart-item-info h3 {
    font-size: 0.9375rem;
  }

  .cart-item-info p {
    font-size: 0.875rem;
  }

  .quantity-controls button {
    width: 2rem;
    height: 2rem;
  }

  .quantity-controls span {
    font-size: 0.875rem;
  }

  .total {
    font-size: 1.125rem;
  }

  .promo-section input {
    font-size: 0.875rem;
    padding: 0.5rem;
  }

  .promo-section button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .order-form input, .order-form textarea {
    font-size: 0.875rem;
    padding: 0.5rem;
  }

  .submit-btn, .close-cart-btn {
    padding: 0.625rem;
    font-size: 0.9375rem;
  }

  .order-confirmation {
    font-size: 0.875rem;
    padding: 0.75rem 1.5rem;
  }

  .close-modal-button {
    width: 2.5rem;
    height: 2.5rem;
  }
}

@media (max-width: 320px) {
  :root {
    --spacing-unit: 0.375rem;
  }

  .best-seller-image, .menu-product-image {
    width: 80px;
    height: 80px;
  }

  .best-seller-product h3, .menu-product h3 {
    font-size: 0.875rem;
  }

  .menu-nav a {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    min-width: 3.5rem;
  }

  .modal-image {
    max-height: 20rem;
  }
}

/* Фиксы для Safari */
@supports (-webkit-overflow-scrolling: touch) {
  .modal-content {
    -webkit-overflow-scrolling: touch;
  }
  .search-bar input, .order-form input, .order-form textarea {
    appearance: none;
  }
}

/* Оптимизация для слабых устройств */
@media (prefers-reduced-data: reduce) {
  .modal-image,
  .best-seller-image,
  .menu-product-image,
  .cart-item-image,
  .halal-img,
  .story-image {
    loading: lazy;
  }
}