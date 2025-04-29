import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import Cart from "./Cart";
import "../styles/Products.css";
import halal from "../images/halal_png.png";
import { useSwipeable } from "react-swipeable";
import LazyImage from "./LazyImage";
import jpgPlaceholder from "../images/cat.jpg";
import { FiSearch, FiX, FiShoppingCart, FiChevronDown } from "react-icons/fi";

// Константы
const STORY_DURATION = 5000;
const STORY_INTERVAL = 50;
const BASE_URL = "https://nukesul-brepb-651f.twc1.net";
const NOTIFICATION_DURATION = 2000;

// Приоритет категорий
const CATEGORY_PRIORITY = [
  "Пиццы", "Половинка_Пиццы", "Комбо", "Сет", "Бургеры", "Шаурмы", "Суши", "Плов", "Десерты", "Блинчики",
  "Закуски", "Восточная_кухня", "Европейская_кухня", "Стейки_и_горячие_блюда", "Горячие_блюда", "Супы",
  "Манты", "Вок", "Гарниры", "Закуски_и_гарниры", "Завтраки", "Детское_меню", "Салаты", "Соусы", "Хлеб",
  "Горячие_напитки", "Напитки", "Лимонады", "Коктейли", "Бабл_ти", "Кофе",
];

function Products() {
  // Состояния
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedTasteVariant, setSelectedTasteVariant] = useState(null);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [isOrderSection, setIsOrderSection] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewedStories, setViewedStories] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [orderDetails, setOrderDetails] = useState({ name: "", phone: "", comments: "" });
  const [deliveryDetails, setDeliveryDetails] = useState({ name: "", phone: "", address: "", comments: "" });
  const [isOrderSent, setIsOrderSent] = useState(false);
  const [isCartNotification, setIsCartNotification] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(() => localStorage.getItem("selectedBranch") || null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(!localStorage.getItem("selectedBranch"));
  const [error, setError] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [stories, setStories] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  // Рефы
  const storyTimerRef = useRef(null);
  const modalRef = useRef(null);
  const menuRef = useRef(null);
  const sectionRefs = useRef({});

  // API-запросы
  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/public/branches`);
      if (!response.ok) throw new Error("Не удалось загрузить филиалы. Попробуйте позже.");
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("Филиалы не найдены.");
      setBranches(data);
      if (!selectedBranch && data.length > 0) {
        handleBranchSelect(data[0].id.toString());
      }
    } catch (error) {
      setError(error.message);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  const fetchProducts = useCallback(async () => {
    if (!selectedBranch) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/public/branches/${selectedBranch}/products`);
      if (!response.ok) throw new Error("Не удалось загрузить продукты. Попробуйте позже.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Неверный формат данных о продуктах.");
      setProducts(data);
      const groupedItems = data.reduce((acc, product) => {
        acc[product.category] = acc[product.category] || [];
        acc[product.category].push(product);
        return acc;
      }, {});
      const sortedCategories = Object.fromEntries(
        Object.entries(groupedItems).sort(([catA], [catB]) => {
          const indexA = CATEGORY_PRIORITY.indexOf(catA);
          const indexB = CATEGORY_PRIORITY.indexOf(catB);
          return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
        })
      );
      setMenuItems(sortedCategories);
      if (Object.keys(sortedCategories).length === 0) {
        setError("Продукты не найдены для выбранного филиала.");
      }
    } catch (error) {
      setError(error.message);
      setProducts([]);
      setMenuItems({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/public/stories`);
      if (!response.ok) throw new Error("Не удалось загрузить истории.");
      const data = await response.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrderHistory = useCallback(async () => {
    if (!selectedBranch) return;
    try {
      const response = await fetch(`${BASE_URL}/api/public/branches/${selectedBranch}/orders`);
      if (!response.ok) throw new Error("Не удалось загрузить историю заказов.");
      const data = await response.json();
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
    }
  }, [selectedBranch]);

  // Инициализация данных
  useEffect(() => {
    fetchBranches();
    fetchStories();
  }, [fetchBranches, fetchStories]);

  useEffect(() => {
    if (selectedBranch) {
      fetchProducts();
      fetchOrderHistory();
    }
  }, [selectedBranch, fetchProducts, fetchOrderHistory]);

  // Сохранение корзины
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Обработка прокрутки для активной категории
  useEffect(() => {
    const handleScroll = () => {
      let currentCategory = "";
      Object.keys(sectionRefs.current).forEach((category) => {
        const section = sectionRefs.current[category];
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            currentCategory = category;
          }
        }
      });
      if (currentCategory && currentCategory !== activeCategory) {
        setActiveCategory(currentCategory);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCategory]);

  useEffect(() => {
    if (!menuRef.current || !activeCategory) return;
    const activeItem = menuRef.current.querySelector(`a[href="#${activeCategory}"]`);
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeCategory]);

  // Блокировка прокрутки
  useEffect(() => {
    if (isProductModalOpen || isCartOpen || isStoryModalOpen || isBranchModalOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isProductModalOpen, isCartOpen, isStoryModalOpen, isBranchModalOpen]);

  // Закрытие модальных окон по Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isProductModalOpen) closeProductModal();
        if (isCartOpen) handleCartClose();
        if (isStoryModalOpen) closeStoryModal();
        if (isBranchModalOpen) setIsBranchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProductModalOpen, isCartOpen, isStoryModalOpen, isBranchModalOpen]);

  // Логика сторис
  const startStoryTimer = useCallback(() => {
    if (isPaused) return;
    clearStoryTimer();
    const steps = STORY_DURATION / STORY_INTERVAL;
    let step = 0;

    storyTimerRef.current = setInterval(() => {
      step++;
      setProgress((step / steps) * 100);
      if (step >= steps) goToNextStory();
    }, STORY_INTERVAL);
  }, [isPaused]);

  const clearStoryTimer = useCallback(() => {
    if (storyTimerRef.current) {
      clearInterval(storyTimerRef.current);
      storyTimerRef.current = null;
    }
  }, []);

  const openStoryModal = useCallback((index) => {
    setCurrentStoryIndex(index);
    setIsStoryModalOpen(true);
    setProgress(0);
    startStoryTimer();
  }, [startStoryTimer]);

  const closeStoryModal = useCallback(() => {
    setIsStoryModalOpen(false);
    setProgress(0);
    clearStoryTimer();
  }, [clearStoryTimer]);

  const goToNextStory = useCallback(() => {
    setViewedStories((prev) => new Set(prev).add(currentStoryIndex));
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
      startStoryTimer();
    } else {
      closeStoryModal();
    }
  }, [currentStoryIndex, stories.length, startStoryTimer, closeStoryModal]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
      startStoryTimer();
    }
  }, [currentStoryIndex, startStoryTimer]);

  const storySwipeHandlers = useSwipeable({
    onSwipedLeft: goToNextStory,
    onSwipedRight: goToPrevStory,
    onTap: () => {
      setIsPaused((prev) => {
        if (!prev) clearStoryTimer();
        else startStoryTimer();
        return !prev;
      });
    },
    preventScrollOnSwipe: true,
  });

  // Обработчики корзины
  const handleCartOpen = useCallback(() => setIsCartOpen(true), []);
  const handleCartClose = useCallback(() => setIsCartOpen(false), []);

  // Обработка продукта
  const hasPriceVariants = useCallback((product) => {
    const priceFields = [
      product.price_single,
      product.price,
      product.price_small,
      product.price_medium,
      product.price_large,
    ].filter((price) => price !== undefined && price !== null);
    return priceFields.length > 1;
  }, []);

  const hasTasteVariants = useCallback((product) => {
    return product.variants && product.variants.length > 0;
  }, []);

  const getPriceOptions = useCallback((product) => {
    const options = [];
    const isDrink = product.category === "Напитки";

    if (isDrink) {
      if (product.price_small) options.push({ key: "small", price: product.price_small, label: "0.5 л" });
      if (product.price_medium) options.push({ key: "medium", price: product.price_medium, label: "1 л" });
      if (product.price_large) options.push({ key: "large", price: product.price_large, label: "1.5 л" });
    } else {
      if (product.price_small) options.push({ key: "small", price: product.price_small, label: "Маленькая" });
      if (product.price_medium) options.push({ key: "medium", price: product.price_medium, label: "Средняя" });
      if (product.price_large) options.push({ key: "large", price: product.price_large, label: "Большая" });
    }

    if (product.price_single) options.push({ key: "single", price: product.price_single, label: isDrink ? "Стандартный объем" : "Стандарт" });
    if (product.price && !options.length) options.push({ key: "default", price: product.price, label: "Базовая" });

    return options;
  }, []);

  const calculateProductPrice = useCallback((price, discountPercent) => {
    const basePrice = Number(price) || 0;
    const discount = Number(discountPercent) || 0;
    return basePrice * (1 - discount / 100);
  }, []);

  const getMinPriceWithDiscount = useCallback((product) => {
    const priceOptions = getPriceOptions(product);
    const prices = priceOptions.map((option) => calculateProductPrice(option.price, product.discount_percent));
    return Math.min(...prices);
  }, [getPriceOptions, calculateProductPrice]);

  const getDisplayPrice = useCallback((product) => {
    if (hasPriceVariants(product)) {
      const minPrice = getMinPriceWithDiscount(product);
      return product.discount_percent ? (
        <>
          <span className="original-price">
            от {Math.min(...getPriceOptions(product).map((opt) => Number(opt.price)))} сом
          </span>{" "}
          <span className="discounted-price">от {minPrice.toFixed(2)} сом</span>
        </>
      ) : (
        `от ${Math.min(...getPriceOptions(product).map((opt) => Number(opt.price)))} сом`
      );
    } else {
      const price = Number(product.price_single || product.price || 0);
      const discountedPrice = calculateProductPrice(price, product.discount_percent);
      return product.discount_percent ? (
        <>
          <span className="original-price">{price.toFixed(2)} сом</span>{" "}
          <span className="discounted-price">{discountedPrice.toFixed(2)} сом</span>
        </>
      ) : (
        `${price.toFixed(2)} сом`
      );
    }
  }, [hasPriceVariants, getPriceOptions, calculateProductPrice, getMinPriceWithDiscount]);

  const handleProductClick = useCallback((product, category) => {
    setSelectedProduct({ product, category });
    setSelectedVariant(null);
    setSelectedTasteVariant(null);
    setIsProductModalOpen(true);
  }, []);

  const handleAddToCart = useCallback(() => {
    try {
      if (!selectedProduct?.product) return;

      const priceOptions = getPriceOptions(selectedProduct.product);
      if (hasPriceVariants(selectedProduct.product) && !selectedVariant) {
        throw new Error("Выберите вариант размера.");
      }
      if (hasTasteVariants(selectedProduct.product) && !selectedTasteVariant) {
        throw new Error("Выберите вариант вкуса.");
      }

      const selectedOption = selectedVariant
        ? priceOptions.find((opt) => opt.key === selectedVariant)
        : priceOptions[0];

      const selectedTaste = selectedTasteVariant
        ? selectedProduct.product.variants.find((variant) => variant.name === selectedTasteVariant)
        : null;

      const basePrice = Number(selectedOption.price) || 0;
      const discountedBasePrice = calculateProductPrice(basePrice, selectedProduct.product.discount_percent);
      const additionalPrice = selectedTaste ? Number(selectedTaste.additionalPrice) || 0 : 0;
      const totalPrice = discountedBasePrice + additionalPrice;

      const itemToAdd = {
        id: priceOptions.length > 1 || hasTasteVariants(selectedProduct.product)
          ? `${selectedProduct.product.id}-${selectedOption.key}-${selectedTasteVariant || "default"}`
          : selectedProduct.product.id,
        name: priceOptions.length > 1 || hasTasteVariants(selectedProduct.product)
          ? `${selectedProduct.product.name} (${selectedOption.label}${selectedTasteVariant ? `, ${selectedTasteVariant}` : ""})`
          : selectedProduct.product.name,
        price: totalPrice,
        originalPrice: basePrice + additionalPrice,
        discountPercent: selectedProduct.product.discount_percent || 0,
        quantity: 1,
        image: selectedProduct.product.image_url,
      };

      setCartItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex((item) => item.id === itemToAdd.id);
        if (existingItemIndex > -1) {
          return prevItems.map((item, index) =>
            index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prevItems, itemToAdd];
      });

      setIsCartNotification(true);
      setTimeout(() => setIsCartNotification(false), NOTIFICATION_DURATION);
      closeProductModal();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [selectedProduct, selectedVariant, selectedTasteVariant, getPriceOptions, hasPriceVariants, hasTasteVariants, calculateProductPrice]);

  const handleQuantityChange = useCallback((itemId, change) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Обработчики форм
  const handleOrderChange = useCallback((e) => {
    const { name, value } = e.target;
    setOrderDetails((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleDeliveryChange = useCallback((e) => {
    const { name, value } = e.target;
    setDeliveryDetails((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Промокод
  const handlePromoCodeSubmit = useCallback(async () => {
    if (!promoCode) {
      alert("Введите промокод.");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/public/validate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Неверный промокод.");
      }
      const data = await response.json();
      setDiscount(Number(data.discount) || 0);
      alert(`Промокод применен! Скидка ${data.discount}%`);
    } catch (error) {
      alert(error.message);
    }
  }, [promoCode]);

  // Валидация
  const validatePhone = useCallback((phone) => {
    const phoneRegex = /^\+?\d{10,12}$/;
    return phoneRegex.test(phone);
  }, []);

  const validateFields = useCallback(() => {
    const errors = {};
    if (isOrderSection) {
      if (!orderDetails.name) errors.name = "Заполните имя";
      if (!orderDetails.phone) errors.phone = "Заполните телефон";
      else if (!validatePhone(orderDetails.phone)) errors.phone = "Неверный формат телефона (например, +996123456789)";
    } else {
      if (!deliveryDetails.name) errors.name = "Заполните имя";
      if (!deliveryDetails.phone) errors.phone = "Заполните телефон";
      else if (!validatePhone(deliveryDetails.phone)) errors.phone = "Неверный формат телефона (например, +996123456789)";
      if (!deliveryDetails.address) errors.address = "Заполните адрес";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [isOrderSection, orderDetails, deliveryDetails, validatePhone]);

  const sendOrderToServer = useCallback(async () => {
    if (cartItems.length === 0) {
      alert("Корзина пуста!");
      return;
    }
    if (!selectedBranch) {
      alert("Выберите филиал!");
      setIsBranchModalOpen(true);
      return;
    }
    if (!validateFields()) return;

    try {
      const cartItemsWithPrices = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        originalPrice: Number(item.originalPrice) || 0,
        discountedPrice: Number(item.price) || 0,
      }));

      const orderPayload = {
        orderDetails: isOrderSection ? orderDetails : {},
        deliveryDetails: !isOrderSection ? deliveryDetails : {},
        cartItems: cartItemsWithPrices,
        discount: discount || 0,
        promoCode: promoCode || "",
        branchId: parseInt(selectedBranch),
      };

      const response = await fetch(`${BASE_URL}/api/public/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при отправке заказа.");
      }

      setIsOrderSent(true);
      setCartItems([]);
      localStorage.removeItem("cartItems");
      setPromoCode("");
      setDiscount(0);
      setOrderDetails({ name: "", phone: "", comments: "" });
      setDeliveryDetails({ name: "", phone: "", address: "", comments: "" });
      setTimeout(() => setIsOrderSent(false), NOTIFICATION_DURATION);
      fetchOrderHistory();
    } catch (error) {
      alert(error.message);
    }
  }, [cartItems, selectedBranch, isOrderSection, orderDetails, deliveryDetails, discount, promoCode, fetchOrderHistory, validateFields]);

  const calculateTotal = useMemo(() => {
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.originalPrice) || 0;
      return sum + price * item.quantity;
    }, 0);
    const discountedTotal = cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);
    const finalTotal = discountedTotal * (1 - discount / 100);
    return {
      total: total.toFixed(2),
      discountedTotal: finalTotal.toFixed(2),
    };
  }, [cartItems, discount]);

  const closeProductModal = useCallback(() => {
    setIsProductModalOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
      setSelectedVariant(null);
      setSelectedTasteVariant(null);
      setErrorMessage("");
    }, 300);
  }, []);

  const handleBranchSelect = useCallback((branchId) => {
    const branchIdStr = branchId.toString();
    setSelectedBranch(branchIdStr);
    localStorage.setItem("selectedBranch", branchIdStr);
    setIsBranchModalOpen(false);
    setProducts([]);
    setMenuItems({});
    setOrderHistory([]);
    setCartItems([]);
    localStorage.removeItem("cartItems");
  }, []);

  const getImageUrl = useCallback((imageKey) => {
    if (!imageKey) return jpgPlaceholder;
    const key = imageKey.split("/").pop();
    return `${BASE_URL}/product-image/${key}`;
  }, []);

  const cachedImageUrls = useMemo(() => {
    const urls = {};
    products.forEach((product) => {
      if (product.image_url) {
        urls[product.id] = getImageUrl(product.image_url);
      }
    });
    stories.forEach((story) => {
      if (story.image) {
        urls[story.id] = story.image;
      }
    });
    cartItems.forEach((item) => {
      if (item.image) {
        urls[item.id] = getImageUrl(item.image);
      }
    });
    return urls;
  }, [products, stories, cartItems, getImageUrl]);

  const debouncedSetSearchQuery = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    debouncedSetSearchQuery(e.target.value);
  }, [debouncedSetSearchQuery]);

  const handleImageError = useCallback((id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleImageLoad = useCallback((id) => {
    setImageErrors((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Фильтрация и сортировка
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter((product) => {
      if (!product || !product.name) return false;
      if (product.category === "Часто заказывают") return false;
      return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [products, searchQuery]);

  const groupedFilteredItems = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      if (!product.category) return acc;
      acc[product.category] = acc[product.category] || [];
      acc[product.category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  const sortedFilteredCategories = useMemo(() => {
    return Object.fromEntries(
      Object.entries(groupedFilteredItems).sort(([catA], [catB]) => {
        const indexA = CATEGORY_PRIORITY.indexOf(catA);
        const indexB = CATEGORY_PRIORITY.indexOf(catB);
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
      })
    );
  }, [groupedFilteredItems]);

  const bestSellers = useMemo(() => {
    return products
      .filter((product) => product.category === "Часто заказывают")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Рендеринг
  return (
    <div className="menu-wrapper">
      {isLoading && (
        <div className="loader">
          <span>Загрузка...</span>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}

      {/* Модальное окно выбора филиала */}
      {isBranchModalOpen && (
        <div className={`modal-overlay ${isBranchModalOpen ? "open" : ""}`} aria-modal="true" role="dialog">
          <div
            className="modal-content glass-effect"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <h2 className="modal-title">Выберите филиал</h2>
            <div className="branch-list">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`branch-item ${selectedBranch === branch.id.toString() ? "selected" : ""}`}
                  onClick={() => handleBranchSelect(branch.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleBranchSelect(branch.id)}
                >
                  <div className="branch-name">{branch.name} (ID: {branch.id})</div>
                  <div className="branch-address">{branch.address || "Адрес не указан"}</div>
                </div>
              ))}
            </div>
            <button
              className="close-modal-button"
              onClick={() => setIsBranchModalOpen(false)}
              aria-label="Закрыть модальное окно"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Шапка */}
      <header className="header glass-effect">
        <div className="header-content">
          <div className="search-bar">
            <FiSearch className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Поиск по категориям..."
              onChange={handleSearchChange}
              aria-label="Поиск по категориям"
            />
          </div>
        </div>
        {selectedBranch && Object.keys(sortedFilteredCategories).length > 0 && (
          <nav className="menu-nav" ref={menuRef}>
            <ul>
              {Object.keys(sortedFilteredCategories).map((category) =>
                category !== "Часто заказывают" ? (
                  <li key={category}>
                    <a
                      href={`#${category}`}
                      className={activeCategory === category ? "active" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(category)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      aria-current={activeCategory === category ? "page" : undefined}
                    >
                      {category}
                    </a>
                  </li>
                ) : null
              )}
            </ul>
          </nav>
        )}
      </header>

      {/* Информация о филиале */}
      <div className="branch-info">
        {selectedBranch && (
          <span
            onClick={() => setIsBranchModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setIsBranchModalOpen(true)}
          >
            {branches.find((b) => b.id.toString() === selectedBranch)?.name || "Филиал не выбран"}
            <FiChevronDown className="dropdown-icon" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Основной контент */}
      {selectedBranch && (
        <div className="content-wrapper">
          {/* Секция сторис */}
          {stories.length > 0 && (
            <div className="stories-section">
              <h2 className="section-title">Истории</h2>
              <div className="stories-list">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    className={`story-card ${viewedStories.has(index) ? "viewed" : ""}`}
                    onClick={() => openStoryModal(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openStoryModal(index)}
                  >
                    <LazyImage
                      src={cachedImageUrls[story.id] || jpgPlaceholder}
                      alt={`История от ${new Date(story.created_at).toLocaleDateString()}`}
                      placeholder={jpgPlaceholder}
                      className="story-image"
                      loading="lazy"
                      sizes="(max-width: 600px) 100px, 150px"
                      onError={() => handleImageError(story.id)}
                      onLoad={() => handleImageLoad(story.id)}
                    />
                    <p>{new Date(story.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Модальное окно сторис */}
          {isStoryModalOpen && (
            <div
              className={`story-modal ${isStoryModalOpen ? "open" : ""}`}
              {...storySwipeHandlers}
              aria-modal="true"
              role="dialog"
            >
              <div className="story-content glass-effect" ref={modalRef} tabIndex={-1}>
                <div className="story-progress">
                  {stories.map((_, index) => (
                    <div key={index} className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? "100%" : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <LazyImage
                  src={cachedImageUrls[stories[currentStoryIndex].id] || jpgPlaceholder}
                  alt={`История от ${new Date(stories[currentStoryIndex].created_at).toLocaleDateString()}`}
                  placeholder={jpgPlaceholder}
                  className="story-image-full"
                  loading="lazy"
                  sizes="(max-width: 600px) 300px, 500px"
                  onError={() => handleImageError(stories[currentStoryIndex].id)}
                  onLoad={() => handleImageLoad(stories[currentStoryIndex].id)}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                />
                <button
                  className="close-modal"
                  onClick={closeStoryModal}
                  aria-label="Закрыть сторис"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Секция продуктов */}
          <div className="products-section">
            {products.length > 0 ? (
              <>
                {/* Халяль блок */}
                <div className="halal-box glass-effect">
                  <img src={halal} alt="Халяль" className="halal-img" />
                  <div>
                    <h1>Халяль</h1>
                    <p>Всё по стандартам</p>
                  </div>
                </div>

                {/* Секция "Часто заказывают" */}
                {bestSellers.length > 0 && (
                  <>
                    <h2 className="section-title">Часто заказывают</h2>
                    <div className="best-sellers">
                      {bestSellers.map((product) => (
                        <div
                          key={product.id}
                          className="best-seller-product glass-effect"
                          onClick={() => handleProductClick(product, "Часто заказывают")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && handleProductClick(product, "Часто заказывают")}
                        >
                          <div className="best-seller-image-wrapper">
                            <LazyImage
                              src={imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
                              alt={product.name}
                              placeholder={jpgPlaceholder}
                              className="best-seller-image"
                              loading="lazy"
                              sizes="(max-width: 600px) 150px, 200px"
                              onError={() => handleImageError(product.id)}
                              onLoad={() => handleImageLoad(product.id)}
                            />
                            <span className="best-seller-label">Популярное</span>
                          </div>
                          <div className="best-seller-info">
                            <h3>{product.name}</h3>
                            <p>{getDisplayPrice(product)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Меню категорий */}
                <div className="menu-items">
                  {Object.entries(sortedFilteredCategories).length > 0 ? (
                    Object.entries(sortedFilteredCategories).map(([category, items]) =>
                      category !== "Часто заказывают" ? (
                        <div
                          key={category}
                          id={category}
                          className="menu-category"
                          ref={(el) => (sectionRefs.current[category] = el)}
                        >
                          <h2 className="section-title">{category}</h2>
                          <div className="menu-products">
                            {items.map((product) => (
                              <div
                                key={product.id}
                                className="menu-product glass-effect"
                                onClick={() => handleProductClick(product, category)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && handleProductClick(product, category)}
                              >
                                <LazyImage
                                  src={imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
                                  alt={product.name}
                                  placeholder={jpgPlaceholder}
                                  className="menu-product-image"
                                  loading="lazy"
                                  sizes="(max-width: 600px) 100px, 150px"
                                  onError={() => handleImageError(product.id)}
                                  onLoad={() => handleImageLoad(product.id)}
                                />
                                <div className="menu-product-info">
                                  <h3>{product.name}</h3>
                                  <p className="title_prod">{product.description}</p>
                                  <p>{getDisplayPrice(product)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )
                  ) : (
                    <p>Нет доступных категорий</p>
                  )}
                </div>

                {/* История заказов */}
                {orderHistory.length > 0 && (
                  <div className="order-history">
                    <h2 className="section-title">История заказов</h2>
                    <div className="history-items">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="history-item glass-effect">
                          <p>Заказ #{order.id}</p>
                          <p>Сумма: {Number(order.total).toFixed(2)} сом</p>
                          <p>Дата: {new Date(order.created_at).toLocaleString()}</p>
                          <p>Статус: {order.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>Продукты не найдены</p>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно продукта */}
      {selectedProduct && (
        <div
          className={`modal-overlay ${isProductModalOpen ? "open" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeProductModal();
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="modal-content glass-effect"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <button
              className="close-modal-button"
              onClick={closeProductModal}
              aria-label="Закрыть модальное окно"
            >
              <FiX size={24} />
            </button>
            <div className="modal-body">
              <LazyImage
                src={imageErrors[selectedProduct.product.id] ? jpgPlaceholder : cachedImageUrls[selectedProduct.product.id]}
                alt={selectedProduct.product.name}
                placeholder={jpgPlaceholder}
                className="modal-image"
                loading="eager"
                sizes="(max-width: 600px) 200px, 300px"
                onError={() => handleImageError(selectedProduct.product.id)}
                onLoad={() => handleImageLoad(selectedProduct.product.id)}
              />
              <div className="modal-info">
                <h1>{selectedProduct.product.name}</h1>
                <p>{selectedProduct.product.description}</p>
                {hasPriceVariants(selectedProduct.product) ? (
                  <div className="variant-selection">
                    <h3>Выберите размер:</h3>
                    {getPriceOptions(selectedProduct.product).map((option) => {
                      const discountedPrice = calculateProductPrice(option.price, selectedProduct.product.discount_percent);
                      return (
                        <button
                          key={option.key}
                          className={`variant-btn ${selectedVariant === option.key ? "selected" : ""}`}
                          onClick={() => setSelectedVariant(option.key)}
                          aria-pressed={selectedVariant === option.key}
                        >
                          {option.label}{" "}
                          {selectedProduct.product.discount_percent ? (
                            <>
                              <span className="original-price">{option.price} сом</span>{" "}
                              <span className="discounted-price">{discountedPrice.toFixed(2)} сом</span>
                            </>
                          ) : (
                            `(${option.price} сом)`
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p>{getDisplayPrice(selectedProduct.product)}</p>
                )}
                {hasTasteVariants(selectedProduct.product) && (
                  <div className="variant-selection">
                    <h3>Выберите вкус:</h3>
                    {selectedProduct.product.variants.map((variant) => (
                      <button
                        key={variant.name}
                        className={`variant-btn ${selectedTasteVariant === variant.name ? "selected" : ""}`}
                        onClick={() => setSelectedTasteVariant(variant.name)}
                        aria-pressed={selectedTasteVariant === variant.name}
                      >
                        {variant.name} {variant.additionalPrice > 0 ? `(+${variant.additionalPrice} сом)` : ""}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  aria-label="Добавить в корзину"
                >
                  <FiShoppingCart size={18} />
                  Добавить в корзину
                </button>
                {errorMessage && <p className="error">{errorMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Корзина */}
      <Cart cartItems={cartItems} onClick={handleCartOpen} />
      {isCartOpen && (
        <div className={`cart-panel glass-effect ${isCartOpen ? "open" : ""}`} aria-modal="true" role="dialog">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Корзина пуста</p>
              <button
                className="close-cart-btn"
                onClick={handleCartClose}
                aria-label="Закрыть корзину"
              >
                <FiX size={24} />
              </button>
            </div>
          ) : (
            <>
              <div className="cart-header">
                <button
                  className={`tab-btn ${!isOrderSection ? "active" : ""}`}
                  onClick={() => setIsOrderSection(false)}
                  aria-selected={!isOrderSection}
                >
                  Доставка
                </button>
                <button
                  className={`tab-btn ${isOrderSection ? "active" : ""}`}
                  onClick={() => setIsOrderSection(true)}
                  aria-selected={isOrderSection}
                >
                  С собой
                </button>
              </div>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item glass-effect">
                    <LazyImage
                      src={imageErrors[item.id] ? jpgPlaceholder : cachedImageUrls[item.id]}
                      alt={item.name}
                      placeholder={jpgPlaceholder}
                      className="cart-item-image"
                      loading="lazy"
                      sizes="(max-width: 600px) 80px, 100px"
                      onError={() => handleImageError(item.id)}
                      onLoad={() => handleImageLoad(item.id)}
                    />
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      {item.discountPercent > 0 ? (
                        <>
                          <p className="original-price">{Number(item.originalPrice).toFixed(2)} сом</p>
                          <p>{Number(item.price).toFixed(2)} сом</p>
                        </>
                      ) : (
                        <p>{Number(item.price).toFixed(2)} сом</p>
                      )}
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          aria-label="Уменьшить количество"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          aria-label="Увеличить количество"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <div className="total">
                  Итого:{" "}
                  {discount > 0 ? (
                    <>
                      <span className="original-total">{calculateTotal.total} сом</span>{" "}
                      <span>{calculateTotal.discountedTotal} сом</span>
                    </>
                  ) : (
                    `${calculateTotal.total} сом`
                  )}
                </div>
                <div className="promo-section">
                  <input
                    type="text"
                    placeholder="Промокод"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    aria-label="Ввести промокод"
                  />
                  <button onClick={handlePromoCodeSubmit} aria-label="Применить промокод">
                    Применить
                  </button>
                </div>
                {isOrderSection ? (
                  <div className="order-form">
                    <input
                      type="text"
                      name="name"
                      value={orderDetails.name}
                      onChange={handleOrderChange}
                      placeholder="Имя"
                      aria-label="Имя"
                      aria-invalid={!!formErrors.name}
                    />
                    {formErrors.name && <p className="error">{formErrors.name}</p>}
                    <input
                      type="text"
                      name="phone"
                      value={orderDetails.phone}
                      onChange={handleOrderChange}
                      placeholder="+996123456789"
                      aria-label="Телефон"
                      aria-invalid={!!formErrors.phone}
                    />
                    {formErrors.phone && <p className="error">{formErrors.phone}</p>}
                    <textarea
                      name="comments"
                      value={orderDetails.comments}
                      onChange={handleOrderChange}
                      placeholder="Комментарии"
                      aria-label="Комментарии к заказу"
                    />
                  </div>
                ) : (
                  <div className="order-form">
                    <input
                      type="text"
                      name="name"
                      value={deliveryDetails.name}
                      onChange={handleDeliveryChange}

                      placeholder="Имя"
                      aria-label="Имя"
                      
                      aria-invalid={!!formErrors.name}
                    />
                    {formErrors.name && <p className="error">{formErrors.name}</p>}
                    <input
                      type="text"
                      name="phone"
                      value={deliveryDetails.phone}
                      onChange={handleDeliveryChange}
                      placeholder="+996123456789"
                      aria-label="Телефон"
                      aria-invalid={!!formErrors.phone}
                    />
                    {formErrors.phone && <p className="error">{formErrors.phone}</p>}
                    <input
                      type="text"
                      name="address"
                      value={deliveryDetails.address}
                      onChange={handleDeliveryChange}
                      placeholder="Адрес доставки"
                      aria-label="Адрес доставки"
                      aria-invalid={!!formErrors.address}
                    />
                    {formErrors.address && <p className="error">{formErrors.address}</p>}
                    <textarea
                      name="comments"
                      value={deliveryDetails.comments}
                      onChange={handleDeliveryChange}
                      placeholder="Комментарии"
                      aria-label="Комментарии к доставке"
                    />
                  </div>
                )}
                <button
                  className="submit-btn"
                  onClick={sendOrderToServer}
                  aria-label="Оформить заказ"
                >
                  Оформить заказ
                </button>
                <button
                  className="close-cart-btn"
                  onClick={handleCartClose}
                  aria-label="Закрыть корзину"
                >
                  <FiX size={24} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Уведомления */}
      {isOrderSent && (
        <div className="order-confirmation glass-effect" role="alert">
          <p>Заказ успешно отправлен!</p>
        </div>
      )}
      {isCartNotification && (
        <div className="cart-notification glass-effect" role="alert">
          <p>Товар добавлен в корзину!</p>
        </div>
      )}
    </div>
  );
}

export default Products;