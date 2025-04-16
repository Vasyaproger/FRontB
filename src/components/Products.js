import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import Cart from "./Cart";
import "../styles/Products.css";
import halal from "../images/halal_png.png";
import { useSwipeable } from "react-swipeable";
import LazyImage from "./LazyImage";
import jpgPlaceholder from "../images/cat.jpg";
import { FiSearch, FiX, FiShoppingCart, FiChevronDown } from "react-icons/fi";

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
  const [filterPrice, setFilterPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const storyTimerRef = useRef(null);
  const [orderDetails, setOrderDetails] = useState({ name: "", phone: "", comments: "" });
  const [deliveryDetails, setDeliveryDetails] = useState({ name: "", phone: "", address: "", comments: "" });
  const [isOrderSent, setIsOrderSent] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(() => localStorage.getItem("selectedBranch") || null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(!localStorage.getItem("selectedBranch"));
  const [error, setError] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [stories, setStories] = useState([]);
  const modalRef = useRef(null);
  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const baseURL = "https://nukesul-brepb-651f.twc1.net";
  const [imageErrors, setImageErrors] = useState({});

  // Эмодзи для категорий
  const categoryEmojis = {
    Пиццы: "🍕",
    Половинка_Пиццы: "🍕",
    Комбо: "🍕🍔🍟",
    Сет: "🍱",
    Бургеры: "🍔",
    Шаурмы: "🌯",
    Суши: "🍣",
    Плов: "🍚",
    Десерты: "🍰",
    Блинчики: "🥞",
    Закуски: "🍟",
    Восточная_кухня: "🥘",
    Европейская_кухня: "🍝",
    Стейки_и_горячие_блюда: "🥩🔥",
    Горячие_блюда: "🍲",
    Супы: "🥣",
    Манты: "🥟",
    Вок: "🍜",
    Гарниры: "🍟",
    Закуски_и_гарниры: "🍢",
    Завтраки: "🥞",
    Детское_меню: "👶🍴",
    Шашлыки: "🥩",
    Салаты: "🥗",
    Соусы: "🥫",
    Хлеб: "🥖",
    Горячие_напитки: "☕",
    Напитки: "🍹",
    Лимонады: "🍋",
    Коктейли: "🍸",
    Бабл_ти: "🧋",
    Кофе: "☕",
  };

  // Приоритет категорий
  const priority = [
    "Пиццы", "Половинка_Пиццы", "Комбо", "Сет", "Бургеры", "Шаурмы", "Суши", "Плов", "Десерты", "Блинчики",
    "Закуски", "Восточная_кухня", "Европейская_кухня", "Стейки_и_горячие_блюда", "Горячие_блюда", "Супы",
    "Манты", "Вок", "Гарниры", "Закуски_и_гарниры", "Завтраки", "Детское_меню", "Салаты", "Соусы", "Хлеб",
    "Горячие_напитки", "Напитки", "Лимонады", "Коктейли", "Бабл_ти", "Кофе",
  ];

  // Функции для работы с API
  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseURL}/api/public/branches`);
      if (!response.ok) throw new Error(`Ошибка загрузки филиалов: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Неверный формат данных о филиалах");
      console.log("Полученные филиалы:", data); // Логирование для отладки
      setBranches(data);
      if (data.length === 0) {
        setError("Филиалы не найдены");
        setIsBranchModalOpen(true);
      }
    } catch (error) {
      setError(`Не удалось загрузить филиалы: ${error.message}`);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!selectedBranch) {
      console.warn("Филиал не выбран, загрузка продуктов отменена");
      return;
    }
    setIsLoading(true);
    try {
      console.log(`Загрузка продуктов для филиала: ${selectedBranch}`);
      const response = await fetch(`${baseURL}/api/public/branches/${selectedBranch}/products`);
      if (!response.ok) throw new Error(`Ошибка загрузки продуктов: ${response.status}`);
      const data = await response.json();
      console.log("Полученные данные о продуктах:", data);
      if (!Array.isArray(data)) throw new Error("Неверный формат данных о продуктах");
      setProducts(data);
      const groupedItems = data.reduce((acc, product) => {
        acc[product.category] = acc[product.category] || [];
        acc[product.category].push(product);
        return acc;
      }, {});
      console.log("Сгруппированные продукты:", groupedItems);
      const sortedCategories = Object.fromEntries(
        Object.entries(groupedItems).sort(([catA], [catB]) => {
          const indexA = priority.indexOf(catA);
          const indexB = priority.indexOf(catB);
          return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
        })
      );
      console.log("Отсортированные категории:", sortedCategories);
      setMenuItems(sortedCategories);
      if (Object.keys(sortedCategories).length === 0) {
        setError("Продукты не найдены для выбранного филиала");
      }
    } catch (error) {
      console.error("Ошибка при загрузке продуктов:", error);
      setError(`Не удалось загрузить продукты: ${error.message}`);
      setProducts([]);
      setMenuItems({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/public/stories`);
      if (!response.ok) throw new Error(`Ошибка загрузки историй: ${response.status}`);
      const data = await response.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(`Не удалось загрузить истории: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrderHistory = useCallback(async () => {
    if (!selectedBranch) return;
    try {
      const response = await fetch(`${baseURL}/api/public/branches/${selectedBranch}/orders`);
      if (!response.ok) throw new Error(`Ошибка загрузки истории заказов: ${response.status}`);
      const data = await response.json();
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(`Не удалось загрузить историю заказов: ${error.message}`);
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

  // Сохранение корзины в localStorage
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

  // Блокировка прокрутки при открытии модальных окон
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

  // Закрытие модальных окон по клавише Escape
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
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let step = 0;

    storyTimerRef.current = setInterval(() => {
      step++;
      setProgress((step / steps) * 100);
      if (step >= steps) goToNextStory();
    }, interval);
  }, [isPaused]);

  const clearStoryTimer = () => {
    if (storyTimerRef.current) {
      clearInterval(storyTimerRef.current);
      storyTimerRef.current = null;
    }
  };

  const openStoryModal = (index) => {
    setCurrentStoryIndex(index);
    setIsStoryModalOpen(true);
    setProgress(0);
    startStoryTimer();
  };

  const closeStoryModal = () => {
    setIsStoryModalOpen(false);
    setProgress(0);
    clearStoryTimer();
  };

  const goToNextStory = () => {
    setViewedStories((prev) => new Set(prev).add(currentStoryIndex));
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
      startStoryTimer();
    } else {
      closeStoryModal();
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
      startStoryTimer();
    }
  };

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
  const handleCartOpen = () => setIsCartOpen(true);
  const handleCartClose = () => setIsCartOpen(false);

  // Обработчики продукта
  const handleProductClick = useCallback((product, category) => {
    setSelectedProduct({ product, category });
    setSelectedVariant(null);
    setSelectedTasteVariant(null);
    setIsProductModalOpen(true);
  }, []);

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

  const handleAddToCart = useCallback(() => {
    try {
      if (!selectedProduct?.product) return;

      const priceOptions = getPriceOptions(selectedProduct.product);
      if (hasPriceVariants(selectedProduct.product) && !selectedVariant) {
        throw new Error("Выберите вариант размера перед добавлением в корзину.");
      }
      if (hasTasteVariants(selectedProduct.product) && !selectedTasteVariant) {
        throw new Error("Выберите вариант вкуса перед добавлением в корзину.");
      }

      const selectedOption = selectedVariant
        ? priceOptions.find((opt) => opt.key === selectedVariant)
        : priceOptions[0];

      const selectedTaste = selectedTasteVariant
        ? selectedProduct.product.variants.find((variant) => variant.name === selectedTasteVariant)
        : null;

      const basePrice = Number(selectedOption.price) || 0;
      const additionalPrice = selectedTaste ? Number(selectedTaste.additionalPrice) || 0 : 0;
      const totalPrice = basePrice + additionalPrice;

      const itemToAdd = {
        id: priceOptions.length > 1 || hasTasteVariants(selectedProduct.product)
          ? `${selectedProduct.product.id}-${selectedOption.key}-${selectedTasteVariant || "default"}`
          : selectedProduct.product.id,
        name: priceOptions.length > 1 || hasTasteVariants(selectedProduct.product)
          ? `${selectedProduct.product.name} (${selectedOption.label}${selectedTasteVariant ? `, ${selectedTasteVariant}` : ""})`
          : selectedProduct.product.name,
        price: totalPrice,
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

      closeProductModal();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [selectedProduct, selectedVariant, selectedTasteVariant, getPriceOptions, hasPriceVariants, hasTasteVariants]);

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
    try {
      const response = await fetch(`${baseURL}/api/public/validate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Неверный промокод");
      }
      const data = await response.json();
      setDiscount(Number(data.discount) || 0);
      alert(`Промокод применен! Скидка ${data.discount}%`);
    } catch (error) {
      alert(error.message || "Ошибка проверки промокода.");
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
        originalPrice: Number(item.price) || 0,
        discountedPrice: calculateDiscountedPrice(item.price),
      }));
  
      console.log("Отправка заказа с branchId:", selectedBranch);
      const orderPayload = {
        orderDetails: isOrderSection ? orderDetails : {},
        deliveryDetails: !isOrderSection ? deliveryDetails : {},
        cartItems: cartItemsWithPrices,
        discount: discount || 0,
        promoCode: promoCode || "",
        branchId: parseInt(selectedBranch),
      };
      console.log("Полный payload заказа:", orderPayload);
  
      const response = await fetch(`${baseURL}/api/public/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка: ${response.status}`);
      }
  
      setIsOrderSent(true);
      setCartItems([]);
      localStorage.removeItem("cartItems");
      setPromoCode("");
      setDiscount(0);
      setOrderDetails({ name: "", phone: "", comments: "" });
      setDeliveryDetails({ name: "", phone: "", address: "", comments: "" });
      setTimeout(() => setIsOrderSent(false), 3000);
      fetchOrderHistory();
    } catch (error) {
      console.error("Ошибка при отправке заказа:", error);
      alert(error.message || "Ошибка при отправке заказа");
    }
  }, [cartItems, selectedBranch, isOrderSection, orderDetails, deliveryDetails, discount, promoCode, fetchOrderHistory, validateFields]);
  const calculateDiscountedPrice = useCallback((price) => {
    const validPrice = Number(price) || 0;
    return validPrice * (1 - discount / 100);
  }, [discount]);

  const calculateTotal = useMemo(() => {
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);
    const discountedTotal = total * (1 - discount / 100);
    return {
      total: total.toFixed(2),
      discountedTotal: discountedTotal.toFixed(2),
    };
  }, [cartItems, discount]);

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
      setSelectedVariant(null);
      setSelectedTasteVariant(null);
      setErrorMessage("");
    }, 300);
  };

  const handleBranchSelect = useCallback((branchId) => {
    console.log("Выбран филиал с ID:", branchId); // Логирование для отладки
    setSelectedBranch(branchId);
    localStorage.setItem("selectedBranch", branchId);
    setIsBranchModalOpen(false);
    setProducts([]);
    setMenuItems({});
    setOrderHistory([]);
    setCartItems([]);
    localStorage.removeItem("cartItems");
  }, []);

  const getImageUrl = useCallback((imageKey) => {
    if (!imageKey) {
      console.warn("imageKey отсутствует, возвращается placeholder");
      return jpgPlaceholder;
    }
    const key = imageKey.split("/").pop();
    const url = `${baseURL}/product-image/${key}`;
    console.log(`Формирование URL для изображения: ${url}`);
    return url;
  }, []);

  // Дебаунсинг поиска
  const debouncedSetSearchQuery = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSetSearchQuery(e.target.value);
  };

  const handleImageError = (id) => {
    console.warn(`Ошибка загрузки изображения для продукта с id: ${id}`);
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageLoad = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: false }));
  };

  // Фильтрация продуктов
  const filteredProducts = useMemo(() => {
    console.log("Фильтрация продуктов:", products);
    if (!products || products.length === 0) {
      console.warn("Продукты отсутствуют для фильтрации");
      return [];
    }
    return products.filter((product) => {
      if (!product || !product.name) {
        console.warn("Некорректный продукт:", product);
        return false;
      }
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const priceToCheck = Number(product.price_single || product.price_small || product.price || 0);
      const matchesPrice = !filterPrice || priceToCheck <= filterPrice;
      return matchesSearch && matchesPrice;
    });
  }, [products, searchQuery, filterPrice]);

  const groupedFilteredItems = useMemo(() => {
    console.log("Группировка отфильтрованных продуктов:", filteredProducts);
    return filteredProducts.reduce((acc, product) => {
      if (!product.category) {
        console.warn("Продукт без категории:", product);
        return acc;
      }
      acc[product.category] = acc[product.category] || [];
      acc[product.category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  const sortedFilteredCategories = useMemo(() => {
    console.log("Сортировка отфильтрованных категорий:", groupedFilteredItems);
    return Object.fromEntries(
      Object.entries(groupedFilteredItems).sort(([catA], [catB]) => {
        const indexA = priority.indexOf(catA);
        const indexB = priority.indexOf(catB);
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
      })
    );
  }, [groupedFilteredItems]);

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
        <div className={`modal-overlay ${isBranchModalOpen ? "open" : "close"}`}>
          <div className={`modal-content glass-effect ${isBranchModalOpen ? "open" : "close"}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Выберите филиал</h2>
            <div className="branch-list">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`branch-item ${selectedBranch === branch.id ? "selected" : ""}`}
                  onClick={() => handleBranchSelect(branch.id)}
                >
                  <div className="branch-name">{branch.name} (ID: {branch.id})</div> {/* Добавляем ID для отладки */}
                  <div className="branch-address">{branch.address || "Адрес не указан"}</div>
                </div>
              ))}
            </div>
            <button className="close-modal-button" onClick={() => setIsBranchModalOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Шапка */}
      <header className="header glass-effect">
        <div className="header-content">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Поиск по категориям..."
              onChange={handleSearchChange}
            />
          </div>
        </div>
        {selectedBranch && Object.keys(sortedFilteredCategories).length > 0 && (
          <nav className="menu-nav" ref={menuRef}>
            <ul>
              {Object.keys(sortedFilteredCategories).map((category) =>
                category !== "Часто продаваемые товары" ? (
                  <li key={category}>
                    <a
                      href={`#${category}`}
                      className={activeCategory === category ? "active" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(category)?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {categoryEmojis[category] || ""} {category}
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
          <span>
            {branches.find((b) => b.id === parseInt(selectedBranch))?.name || "Филиал не выбран"}
            <FiChevronDown className="dropdown-icon" onClick={() => setIsBranchModalOpen(true)} />
          </span>
        )}
      </div>

      {/* Основной контент */}
      {selectedBranch && (
        <div className="content-wrapper">
          {/* Секция сторис */}
          {stories.length > 0 && (
            <div className="stories-section">
              <h2>Истории</h2>
              <div className="stories-list">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    className={`story-card ${viewedStories.has(index) ? "viewed" : ""}`}
                    onClick={() => openStoryModal(index)}
                  >
                    <LazyImage
                      src={story.image}
                      alt="История"
                      placeholder={jpgPlaceholder}
                      className="story-image"
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
            <div className={`story-modal ${isStoryModalOpen ? "open" : "close"}`} {...storySwipeHandlers}>
              <div className={`story-content glass-effect ${isStoryModalOpen ? "open" : "close"}`}>
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
                  src={stories[currentStoryIndex].image}
                  alt="История"
                  placeholder={jpgPlaceholder}
                  className="story-image-full"
                  onError={() => handleImageError(stories[currentStoryIndex].id)}
                  onLoad={() => handleImageLoad(stories[currentStoryIndex].id)}
                />
                <button className="close-modal" onClick={closeStoryModal}>
                  <FiX size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Фильтры */}
          <div className="filters-section glass-effect">
            <h3>Фильтры</h3>
            <div className="filter-options">
              <input
                type="text"
                placeholder="Поиск по названию"
                onChange={handleSearchChange}
              />
              <select
                value={filterPrice || ""}
                onChange={(e) => setFilterPrice(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Все цены</option>
                <option value="500">До 500 сом</option>
                <option value="1000">До 1000 сом</option>
                <option value="1500">До 1500 сом</option>
              </select>
            </div>
          </div>

          {/* Секция продуктов */}
          <div className="products-section">
            {products.length > 0 ? (
              <>
                <h2 className="section-title">Часто продаваемые</h2>
                <div className="best-sellers">
                  {products.filter(product => product.category === "Часто продаваемые товары").length > 0 ? (
                    products.map((product) =>
                      product.category === "Часто продаваемые товары" ? (
                        <div
                          key={product.id}
                          className="best-seller-product glass-effect"
                          onClick={() => handleProductClick(product, "Часто продаваемые товары")}
                        >
                          <LazyImage
                            src={imageErrors[product.id] ? jpgPlaceholder : getImageUrl(product.image_url)}
                            alt={product.name}
                            placeholder={jpgPlaceholder}
                            className="best-seller-image"
                            onError={() => handleImageError(product.id)}
                            onLoad={() => handleImageLoad(product.id)}
                          />
                          <h3>{product.name}</h3>
                          <p>
                            {hasPriceVariants(product)
                              ? `от ${Math.min(...getPriceOptions(product).map((opt) => Number(opt.price)))} сом`
                              : `${Number(product.price_single || product.price || 0)} сом`}
                          </p>
                          <button className="add-btn">Добавить</button>
                        </div>
                      ) : null
                    )
                  ) : (
                    <p>Нет часто продаваемых товаров</p>
                  )}
                </div>

                {/* Халяль блок */}
                <div className="halal-box glass-effect">
                  <img src={halal} alt="Halal" className="halal-img" />
                  <div>
                    <h1>Халяль</h1>
                    <p>Всё по стандартам</p>
                  </div>
                </div>

                {/* Меню */}
                <div className="menu-items">
                  {Object.entries(sortedFilteredCategories).length > 0 ? (
                    Object.entries(sortedFilteredCategories).map(([category, items]) =>
                      category !== "Часто продаваемые товары" ? (
                        <div
                          key={category}
                          id={category}
                          className="menu-category"
                          ref={(el) => (sectionRefs.current[category] = el)}
                        >
                          <h2>{category}</h2>
                          <div className="menu-products">
                            {items.map((product) => (
                              <div
                                key={product.id}
                                className="menu-product glass-effect"
                                onClick={() => handleProductClick(product, category)}
                              >
                                <LazyImage
                                  src={imageErrors[product.id] ? jpgPlaceholder : getImageUrl(product.image_url)}
                                  alt={product.name}
                                  placeholder={jpgPlaceholder}
                                  className="menu-product-image"
                                  onError={() => handleImageError(product.id)}
                                  onLoad={() => handleImageLoad(product.id)}
                                />
                                <div className="menu-product-info">
                                  <h3>{product.name}</h3>
                                  <p className="title_prod">{product.description}</p>
                                  <p>
                                    {hasPriceVariants(product)
                                      ? `от ${Math.min(...getPriceOptions(product).map((opt) => Number(opt.price)))} сом`
                                      : `${Number(product.price_single || product.price || 0)} сом`}
                                  </p>
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
          className={`modal-overlay ${isProductModalOpen ? "open" : "close"}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeProductModal();
          }}
        >
          <div className={`modal-content glass-effect ${isProductModalOpen ? "open" : "close"}`} onClick={(e) => e.stopPropagation()} ref={modalRef}>
            <button className="close-modal" onClick={closeProductModal}>
              <FiX size={24} />
            </button>
            <div className="modal-body">
              <LazyImage
                src={imageErrors[selectedProduct.product.id] ? jpgPlaceholder : getImageUrl(selectedProduct.product.image_url)}
                alt={selectedProduct.product.name}
                placeholder={jpgPlaceholder}
                className="modal-image"
                onError={() => handleImageError(selectedProduct.product.id)}
                onLoad={() => handleImageLoad(selectedProduct.product.id)}
              />
              <div className="modal-info">
                <h1>{selectedProduct.product.name}</h1>
                <p>{selectedProduct.product.description}</p>
                {hasPriceVariants(selectedProduct.product) ? (
                  <div className="variant-selection">
                    <h3>Выберите размер:</h3>
                    {getPriceOptions(selectedProduct.product).map((option) => (
                      <button
                        key={option.key}
                        className={`variant-btn ${selectedVariant === option.key ? "selected" : ""}`}
                        onClick={() => setSelectedVariant(option.key)}
                      >
                        {option.label} ({option.price} сом)
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>Цена: {Number(selectedProduct.product.price_single || selectedProduct.product.price || 0)} сом</p>
                )}
                {hasTasteVariants(selectedProduct.product) && (
                  <div className="variant-selection">
                    <h3>Выберите вкус:</h3>
                    {selectedProduct.product.variants.map((variant) => (
                      <button
                        key={variant.name}
                        className={`variant-btn ${selectedTasteVariant === variant.name ? "selected" : ""}`}
                        onClick={() => setSelectedTasteVariant(variant.name)}
                      >
                        {variant.name} {variant.additionalPrice > 0 ? `(+${variant.additionalPrice} сом)` : ""}
                      </button>
                    ))}
                  </div>
                )}
                <button className="add-to-cart-btn" onClick={handleAddToCart}>
                  <FiShoppingCart size={18} /> Добавить в корзину
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
        <div className={`cart-panel glass-effect ${isCartOpen ? "open" : "close"}`}>
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Корзина пуста</p>
              <button className="close-cart-btn" onClick={handleCartClose}>
                Закрыть
              </button>
            </div>
          ) : (
            <>
              <div className="cart-header">
                <button
                  className={`tab-btn ${!isOrderSection ? "active" : ""}`}
                  onClick={() => setIsOrderSection(false)}
                >
                  Доставка
                </button>
                <button
                  className={`tab-btn ${isOrderSection ? "active" : ""}`}
                  onClick={() => setIsOrderSection(true)}
                >
                  С собой
                </button>
              </div>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item glass-effect">
                    <LazyImage
                      src={imageErrors[item.id] ? jpgPlaceholder : getImageUrl(item.image)}
                      alt={item.name}
                      placeholder={jpgPlaceholder}
                      className="cart-item-image"
                      onError={() => handleImageError(item.id)}
                      onLoad={() => handleImageLoad(item.id)}
                    />
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      {discount > 0 ? (
                        <>
                          <p className="original-price">{Number(item.price).toFixed(2)} сом</p>
                          <p>{calculateDiscountedPrice(item.price).toFixed(2)} сом</p>
                        </>
                      ) : (
                        <p>{Number(item.price).toFixed(2)} сом</p>
                      )}
                      <div className="quantity-controls">
                        <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <div className="total">
                  Итого: {discount > 0 ? (
                    <>
                      <span className="original-total">{calculateTotal.total} сом</span>
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
                  />
                  <button onClick={handlePromoCodeSubmit}>Применить</button>
                </div>
                {isOrderSection ? (
                  <div className="order-form">
                    <input
                      type="text"
                      name="name"
                      value={orderDetails.name}
                      onChange={handleOrderChange}
                      placeholder="Имя"
                    />
                    {formErrors.name && <p className="error">{formErrors.name}</p>}
                    <input
                      type="text"
                      name="phone"
                      value={orderDetails.phone}
                      onChange={handleOrderChange}
                      placeholder="+996123456789"
                    />
                    {formErrors.phone && <p className="error">{formErrors.phone}</p>}
                    <textarea
                      name="comments"
                      value={orderDetails.comments}
                      onChange={handleOrderChange}
                      placeholder="Комментарии"
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
                    />
                    {formErrors.name && <p className="error">{formErrors.name}</p>}
                    <input
                      type="text"
                      name="phone"
                      value={deliveryDetails.phone}
                      onChange={handleDeliveryChange}
                      placeholder="+996123456789"
                    />
                    {formErrors.phone && <p className="error">{formErrors.phone}</p>}
                    <input
                      type="text"
                      name="address"
                      value={deliveryDetails.address}
                      onChange={handleDeliveryChange}
                      placeholder="Адрес доставки"
                    />
                    {formErrors.address && <p className="error">{formErrors.address}</p>}
                    <textarea
                      name="comments"
                      value={deliveryDetails.comments}
                      onChange={handleDeliveryChange}
                      placeholder="Комментарии"
                    />
                  </div>
                )}
                <button className="submit-btn" onClick={sendOrderToServer}>
                  Оформить заказ
                </button>
                <button className="close-cart-btn" onClick={handleCartClose}>
                  Закрыть
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Уведомление об успешном заказе */}
      {isOrderSent && (
        <div className="order-confirmation glass-effect">
          <p>Заказ успешно отправлен!</p>
        </div>
      )}
    </div>
  );
}

export default Products;