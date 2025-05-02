import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from "react";
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

// Утилиты
const getPriceOptions = (product) => {
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
};

const calculateProductPrice = (price, discountPercent) => {
  const basePrice = Number(price) || 0;
  const discount = Number(discountPercent) || 0;
  return basePrice * (1 - discount / 100);
};

const getMinPriceWithDiscount = (product) => {
  const priceOptions = getPriceOptions(product);
  const prices = priceOptions.map((option) => calculateProductPrice(option.price, product.discount_percent));
  return Math.min(...prices);
};

const getDisplayPrice = (product, hasPriceVariants) => {
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
};

const getImageUrl = (imageKey) => {
  if (!imageKey) return jpgPlaceholder;
  const key = imageKey.split("/").pop();
  return `${BASE_URL}/product-image/${key}`;
};

// Reducer для управления состоянием
const initialState = {
  isCartOpen: false,
  products: [],
  menuItems: {},
  selectedProduct: null,
  selectedVariant: null,
  selectedTasteVariant: null,
  cartItems: JSON.parse(localStorage.getItem("cartItems") || "[]"),
  errorMessage: "",
  isProductModalOpen: false,
  activeCategory: "",
  isOrderSection: false,
  isStoryModalOpen: false,
  currentStoryIndex: 0,
  viewedStories: new Set(),
  progress: 0,
  searchQuery: "",
  isLoading: false,
  isPaused: false,
  orderDetails: { name: "", phone: "", comments: "" },
  deliveryDetails: { name: "", phone: "", address: "", comments: "" },
  isOrderSent: false,
  isCartNotification: false,
  promoCode: "",
  discount: 0,
  formErrors: {},
  branches: [],
  selectedBranch: localStorage.getItem("selectedBranch") || null,
  isBranchModalOpen: !localStorage.getItem("selectedBranch"),
  error: null,
  orderHistory: [],
  stories: [],
  imageErrors: {},
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET_MODAL":
      return {
        ...state,
        isProductModalOpen: false,
        selectedProduct: null,
        selectedVariant: null,
        selectedTasteVariant: null,
        errorMessage: "",
      };
    default:
      return state;
  }
};

// Главный компонент
function Products() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const storyTimerRef = useRef(null);
  const modalRef = useRef(null);
  const menuRef = useRef(null);
  const sectionRefs = useRef({});

  // API-запросы
  const fetchBranches = useCallback(async () => {
    dispatch({ type: "SET_STATE", payload: { isLoading: true, error: null } });
    try {
      const response = await fetch(`${BASE_URL}/api/public/branches`);
      if (!response.ok) throw new Error("Не удалось загрузить филиалы. Попробуйте позже.");
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("Филиалы не найдены.");
      dispatch({ type: "SET_STATE", payload: { branches: data } });
      if (!state.selectedBranch && data.length > 0) {
        handleBranchSelect(data[0].id.toString());
      }
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: error.message, branches: [] } });
    } finally {
      dispatch({ type: "SET_STATE", payload: { isLoading: false } });
    }
  }, [state.selectedBranch]);

  const fetchProducts = useCallback(async () => {
    if (!state.selectedBranch) return;
    dispatch({ type: "SET_STATE", payload: { isLoading: true, error: null } });
    try {
      const response = await fetch(`${BASE_URL}/api/public/branches/${state.selectedBranch}/products`);
      if (!response.ok) throw new Error("Не удалось загрузить продукты. Попробуйте позже.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Неверный формат данных о продуктах.");
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
      dispatch({ type: "SET_STATE", payload: { products: data, menuItems: sortedCategories } });
      if (Object.keys(sortedCategories).length === 0) {
        dispatch({ type: "SET_STATE", payload: { error: "Продукты не найдены для выбранного филиала." } });
      }
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: error.message, products: [], menuItems: {} } });
    } finally {
      dispatch({ type: "SET_STATE", payload: { isLoading: false } });
    }
  }, [state.selectedBranch]);

  const fetchStories = useCallback(async () => {
    dispatch({ type: "SET_STATE", payload: { isLoading: true } });
    try {
      const response = await fetch(`${BASE_URL}/api/public/stories`);
      if (!response.ok) throw new Error("Не удалось загрузить истории.");
      const data = await response.json();
      dispatch({ type: "SET_STATE", payload: { stories: Array.isArray(data) ? data : [] } });
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: error.message } });
    } finally {
      dispatch({ type: "SET_STATE", payload: { isLoading: false } });
    }
  }, []);

  const fetchOrderHistory = useCallback(async () => {
    if (!state.selectedBranch) return;
    try {
      const response = await fetch(`${BASE_URL}/api/public/branches/${state.selectedBranch}/orders`);
      if (!response.ok) throw new Error("Не удалось загрузить историю заказов.");
      const data = await response.json();
      dispatch({ type: "SET_STATE", payload: { orderHistory: Array.isArray(data) ? data : [] } });
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: error.message } });
    }
  }, [state.selectedBranch]);

  // Инициализация данных
  useEffect(() => {
    fetchBranches();
    fetchStories();
  }, [fetchBranches, fetchStories]);

  useEffect(() => {
    if (state.selectedBranch) {
      fetchProducts();
      fetchOrderHistory();
    }
  }, [state.selectedBranch, fetchProducts, fetchOrderHistory]);

  // Сохранение корзины
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
  }, [state.cartItems]);

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
      if (currentCategory && currentCategory !== state.activeCategory) {
        dispatch({ type: "SET_STATE", payload: { activeCategory: currentCategory } });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [state.activeCategory]);

  useEffect(() => {
    if (!menuRef.current || !state.activeCategory) return;
    const activeItem = menuRef.current.querySelector(`a[href="#${state.activeCategory}"]`);
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [state.activeCategory]);

  // Блокировка прокрутки и управление фокусом
  useEffect(() => {
    if (state.isProductModalOpen || state.isCartOpen || state.isStoryModalOpen || state.isBranchModalOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [state.isProductModalOpen, state.isCartOpen, state.isStoryModalOpen, state.isBranchModalOpen]);

  // Закрытие модальных окон по Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (state.isProductModalOpen) closeProductModal();
        if (state.isCartOpen) handleCartClose();
        if (state.isStoryModalOpen) closeStoryModal();
        if (state.isBranchModalOpen) dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: false } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isProductModalOpen, state.isCartOpen, state.isStoryModalOpen, state.isBranchModalOpen]);

  // Логика сторис
  const startStoryTimer = useCallback(() => {
    if (state.isPaused) return;
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    const steps = STORY_DURATION / STORY_INTERVAL;
    let step = 0;

    storyTimerRef.current = setInterval(() => {
      step++;
      dispatch({ type: "SET_STATE", payload: { progress: (step / steps) * 100 } });
      if (step >= steps) goToNextStory();
    }, STORY_INTERVAL);
  }, [state.isPaused]);

  const clearStoryTimer = useCallback(() => {
    if (storyTimerRef.current) {
      clearInterval(storyTimerRef.current);
      storyTimerRef.current = null;
    }
  }, []);

  const openStoryModal = useCallback((index) => {
    dispatch({ type: "SET_STATE", payload: { currentStoryIndex: index, isStoryModalOpen: true, progress: 0 } });
    startStoryTimer();
  }, [startStoryTimer]);

  const closeStoryModal = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: { isStoryModalOpen: false, progress: 0 } });
    clearStoryTimer();
  }, [clearStoryTimer]);

  const goToNextStory = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: {
      viewedStories: new Set(state.viewedStories).add(state.currentStoryIndex),
      currentStoryIndex: state.currentStoryIndex < state.stories.length - 1 ? state.currentStoryIndex + 1 : state.currentStoryIndex,
      progress: 0,
    } });
    if (state.currentStoryIndex >= state.stories.length - 1) {
      closeStoryModal();
    } else {
      startStoryTimer();
    }
  }, [state.currentStoryIndex, state.stories.length, startStoryTimer, closeStoryModal]);

  const goToPrevStory = useCallback(() => {
    if (state.currentStoryIndex > 0) {
      dispatch({ type: "SET_STATE", payload: { currentStoryIndex: state.currentStoryIndex - 1, progress: 0 } });
      startStoryTimer();
    }
  }, [state.currentStoryIndex, startStoryTimer]);

  const storySwipeHandlers = useSwipeable({
    onSwipedLeft: goToNextStory,
    onSwipedRight: goToPrevStory,
    onTap: () => {
      dispatch({ type: "SET_STATE", payload: { isPaused: !state.isPaused } });
      if (!state.isPaused) clearStoryTimer();
      else startStoryTimer();
    },
    preventScrollOnSwipe: true,
  });

  // Обработчики корзины
  const handleCartOpen = useCallback(() => dispatch({ type: "SET_STATE", payload: { isCartOpen: true } }), []);
  const handleCartClose = useCallback(() => dispatch({ type: "SET_STATE", payload: { isCartOpen: false } }), []);

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

  const handleProductClick = useCallback((product, category) => {
    dispatch({ type: "SET_STATE", payload: {
      selectedProduct: { product, category },
      selectedVariant: null,
      selectedTasteVariant: null,
      isProductModalOpen: true,
      errorMessage: "",
    } });
  }, []);

  const handleAddToCart = useCallback(() => {
    try {
      if (!state.selectedProduct?.product) return;

      const priceOptions = getPriceOptions(state.selectedProduct.product);
      if (hasPriceVariants(state.selectedProduct.product) && !state.selectedVariant) {
        throw new Error("Выберите вариант размера.");
      }
      if (hasTasteVariants(state.selectedProduct.product) && !state.selectedTasteVariant) {
        throw new Error("Выберите вариант вкуса.");
      }

      const selectedOption = state.selectedVariant
        ? priceOptions.find((opt) => opt.key === state.selectedVariant)
        : priceOptions[0];

      const selectedTaste = state.selectedTasteVariant
        ? state.selectedProduct.product.variants.find((variant) => variant.name === state.selectedTasteVariant)
        : null;

      const basePrice = Number(selectedOption.price) || 0;
      const discountedBasePrice = calculateProductPrice(basePrice, state.selectedProduct.product.discount_percent);
      const additionalPrice = selectedTaste ? Number(selectedTaste.additionalPrice) || 0 : 0;
      const totalPrice = discountedBasePrice + additionalPrice;

      const itemToAdd = {
        id: priceOptions.length > 1 || hasTasteVariants(state.selectedProduct.product)
          ? `${state.selectedProduct.product.id}-${selectedOption.key}-${state.selectedTasteVariant || "default"}`
          : state.selectedProduct.product.id,
        name: priceOptions.length > 1 || hasTasteVariants(state.selectedProduct.product)
          ? `${state.selectedProduct.product.name} (${selectedOption.label}${state.selectedTasteVariant ? `, ${state.selectedTasteVariant}` : ""})`
          : state.selectedProduct.product.name,
        price: totalPrice,
        originalPrice: basePrice + additionalPrice,
        discountPercent: state.selectedProduct.product.discount_percent || 0,
        quantity: 1,
        image: state.selectedProduct.product.image_url,
      };

      dispatch({ type: "SET_STATE", payload: {
        cartItems: state.cartItems.find((item) => item.id === itemToAdd.id)
          ? state.cartItems.map((item) =>
              item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          : [...state.cartItems, itemToAdd],
        isCartNotification: true,
      } });

      setTimeout(() => dispatch({ type: "SET_STATE", payload: { isCartNotification: false } }), NOTIFICATION_DURATION);
      closeProductModal();
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { errorMessage: error.message } });
    }
  }, [state.selectedProduct, state.selectedVariant, state.selectedTasteVariant, state.cartItems]);

  const handleQuantityChange = useCallback((itemId, change) => {
    dispatch({ type: "SET_STATE", payload: {
      cartItems: state.cartItems
        .map((item) => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
        .filter((item) => item.quantity > 0),
    } });
  }, [state.cartItems]);

  // Обработчики форм
  const handleOrderChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: "SET_STATE", payload: {
      orderDetails: { ...state.orderDetails, [name]: value },
      formErrors: { ...state.formErrors, [name]: "" },
    } });
  }, [state.orderDetails, state.formErrors]);

  const handleDeliveryChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: "SET_STATE", payload: {
      deliveryDetails: { ...state.deliveryDetails, [name]: value },
      formErrors: { ...state.formErrors, [name]: "" },
    } });
  }, [state.deliveryDetails, state.formErrors]);

  // Промокод
  const handlePromoCodeSubmit = useCallback(async () => {
    if (!state.promoCode) {
      alert("Введите промокод.");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/public/validate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: state.promoCode }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Неверный промокод.");
      }
      const data = await response.json();
      dispatch({ type: "SET_STATE", payload: { discount: Number(data.discount) || 0 } });
      alert(`Промокод применен! Скидка ${data.discount}%`);
    } catch (error) {
      alert(error.message);
    }
  }, [state.promoCode]);

  // Валидация
  const validatePhone = useCallback((phone) => {
    const phoneRegex = /^\+?\d{10,12}$/;
    return phoneRegex.test(phone);
  }, []);

  const validateFields = useCallback(() => {
    const errors = {};
    if (state.isOrderSection) {
      if (!state.orderDetails.name) errors.name = "Заполните имя";
      if (!state.orderDetails.phone) errors.phone = "Заполните телефон";
      else if (!validatePhone(state.orderDetails.phone)) errors.phone = "Неверный формат телефона (например, +996123456789)";
    } else {
      if (!state.deliveryDetails.name) errors.name = "Заполните имя";
      if (!state.deliveryDetails.phone) errors.phone = "Заполните телефон";
      else if (!validatePhone(state.deliveryDetails.phone)) errors.phone = "Неверный формат телефона (например, +996123456789)";
      if (!state.deliveryDetails.address) errors.address = "Заполните адрес";
    }
    dispatch({ type: "SET_STATE", payload: { formErrors: errors } });
    return Object.keys(errors).length === 0;
  }, [state.isOrderSection, state.orderDetails, state.deliveryDetails]);

  const sendOrderToServer = useCallback(async () => {
    if (state.cartItems.length === 0) {
      alert("Корзина пуста!");
      return;
    }
    if (!state.selectedBranch) {
      alert("Выберите филиал!");
      dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: true } });
      return;
    }
    if (!validateFields()) return;

    try {
      const cartItemsWithPrices = state.cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        originalPrice: Number(item.originalPrice) || 0,
        discountedPrice: Number(item.price) || 0,
      }));

      const orderPayload = {
        orderDetails: state.isOrderSection ? state.orderDetails : {},
        deliveryDetails: !state.isOrderSection ? state.deliveryDetails : {},
        cartItems: cartItemsWithPrices,
        discount: state.discount || 0,
        promoCode: state.promoCode || "",
        branchId: parseInt(state.selectedBranch),
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

      dispatch({ type: "SET_STATE", payload: {
        isOrderSent: true,
        cartItems: [],
        promoCode: "",
        discount: 0,
        orderDetails: { name: "", phone: "", comments: "" },
        deliveryDetails: { name: "", phone: "", address: "", comments: "" },
      } });
      localStorage.removeItem("cartItems");
      setTimeout(() => dispatch({ type: "SET_STATE", payload: { isOrderSent: false } }), NOTIFICATION_DURATION);
      fetchOrderHistory();
    } catch (error) {
      alert(error.message);
    }
  }, [state.cartItems, state.selectedBranch, state.isOrderSection, state.orderDetails, state.deliveryDetails, state.discount, state.promoCode, fetchOrderHistory]);

  const calculateTotal = useMemo(() => {
    const total = state.cartItems.reduce((sum, item) => {
      const price = Number(item.originalPrice) || 0;
      return sum + price * item.quantity;
    }, 0);
    const discountedTotal = state.cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);
    const finalTotal = discountedTotal * (1 - state.discount / 100);
    return {
      total: total.toFixed(2),
      discountedTotal: finalTotal.toFixed(2),
    };
  }, [state.cartItems, state.discount]);

  const closeProductModal = useCallback(() => {
    dispatch({ type: "RESET_MODAL" });
  }, []);

  const handleBranchSelect = useCallback((branchId) => {
    const branchIdStr = branchId.toString();
    dispatch({ type: "SET_STATE", payload: {
      selectedBranch: branchIdStr,
      isBranchModalOpen: false,
      products: [],
      menuItems: {},
      orderHistory: [],
      cartItems: [],
    } });
    localStorage.setItem("selectedBranch", branchIdStr);
    localStorage.removeItem("cartItems");
  }, []);

  const cachedImageUrls = useMemo(() => {
    const urls = {};
    state.products.forEach((product) => {
      if (product.image_url) {
        urls[product.id] = getImageUrl(product.image_url);
      }
    });
    state.stories.forEach((story) => {
      if (story.image) {
        urls[story.id] = story.image;
      }
    });
    state.cartItems.forEach((item) => {
      if (item.image) {
        urls[item.id] = getImageUrl(item.image);
      }
    });
    return urls;
  }, [state.products, state.stories, state.cartItems]);

  const debouncedSetSearchQuery = useMemo(() => debounce((value) => {
    dispatch({ type: "SET_STATE", payload: { searchQuery: value } });
  }, 300), []);

  const handleSearchChange = useCallback((e) => {
    debouncedSetSearchQuery(e.target.value);
  }, [debouncedSetSearchQuery]);

  const handleImageError = useCallback((id) => {
    dispatch({ type: "SET_STATE", payload: { imageErrors: { ...state.imageErrors, [id]: true } } });
  }, [state.imageErrors]);

  const handleImageLoad = useCallback((id) => {
    dispatch({ type: "SET_STATE", payload: { imageErrors: { ...state.imageErrors, [id]: false } } });
  }, [state.imageErrors]);

  // Фильтрация и сортировка
  const filteredProducts = useMemo(() => {
    if (!state.products || state.products.length === 0) return [];
    return state.products.filter((product) => {
      if (!product || !product.name) return false;
      if (product.category === "Часто заказывают") return false;
      return product.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    });
  }, [state.products, state.searchQuery]);

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
    return state.products
      .filter((product) => product.category === "Часто заказывают")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.products]);

  // Рендеринг
  return (
    <div className="menu-wrapper">
      {state.isLoading && (
        <div className="loader">
          <span>Загрузка...</span>
        </div>
      )}
      {state.error && <div className="error-message">{state.error}</div>}

      {/* Модальное окно выбора филиала */}
      {state.isBranchModalOpen && (
        <div className={`modal-overlay ${state.isBranchModalOpen ? "open" : ""}`} aria-modal="true" role="dialog">
          <div
            className="modal-content glass-effect"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <h2 className="modal-title">Выберите филиал</h2>
            <div className="branch-list">
              {state.branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`branch-item ${state.selectedBranch === branch.id.toString() ? "selected" : ""}`}
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
              onClick={() => dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: false } })}
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
        {state.selectedBranch && Object.keys(sortedFilteredCategories).length > 0 && (
          <nav className="menu-nav" ref={menuRef}>
            <ul>
              {Object.keys(sortedFilteredCategories).map((category) =>
                category !== "Часто заказывают" ? (
                  <li key={category}>
                    <a
                      href={`#${category}`}
                      className={state.activeCategory === category ? "active" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(category)?.scrollIntoView({ behavior: "smooth" });
                        dispatch({ type: "SET_STATE", payload: { activeCategory: category } });
                      }}
                      aria-current={state.activeCategory === category ? "page" : undefined}
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
        {state.selectedBranch && (
          <span
            onClick={() => dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: true } })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: true } })}
          >
            {state.branches.find((b) => b.id.toString() === state.selectedBranch)?.name || "Филиал не выбран"}
            <FiChevronDown className="dropdown-icon" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Основной контент */}
      {state.selectedBranch && (
        <div className="content-wrapper">
          {/* Секция сторис */}
          {state.stories.length > 0 && (
            <div className="stories-section">
              <h2 className="section-title">Истории</h2>
              <div className="stories-list">
                {state.stories.map((story, index) => (
                  <div
                    key={story.id}
                    className={`story-card ${state.viewedStories.has(index) ? "viewed" : ""}`}
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
          {state.isStoryModalOpen && (
            <div
              className={`story-modal ${state.isStoryModalOpen ? "open" : ""}`}
              {...storySwipeHandlers}
              aria-modal="true"
              role="dialog"
            >
              <div className="story-content glass-effect" ref={modalRef} tabIndex={-1}>
                <div className="story-progress">
                  {state.stories.map((_, index) => (
                    <div key={index} className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: index === state.currentStoryIndex ? `${state.progress}%` : index < state.currentStoryIndex ? "100%" : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <LazyImage
                  src={cachedImageUrls[state.stories[state.currentStoryIndex].id] || jpgPlaceholder}
                  alt={`История от ${new Date(state.stories[state.currentStoryIndex].created_at).toLocaleDateString()}`}
                  placeholder={jpgPlaceholder}
                  className="story-image-full"
                  loading="lazy"
                  sizes="(max-width: 600px) 300px, 500px"
                  onError={() => handleImageError(state.stories[state.currentStoryIndex].id)}
                  onLoad={() => handleImageLoad(state.stories[state.currentStoryIndex].id)}
                  onMouseEnter={() => dispatch({ type: "SET_STATE", payload: { isPaused: true } })}
                  onMouseLeave={() => dispatch({ type: "SET_STATE", payload: { isPaused: false } })}
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
            {state.products.length > 0 ? (
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
                              src={state.imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
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
                            <p>{getDisplayPrice(product, hasPriceVariants)}</p>
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
                                  src={state.imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
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
                                  <p>{getDisplayPrice(product, hasPriceVariants)}</p>
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
                {state.orderHistory.length > 0 && (
                  <div className="order-history">
                    <h2 className="section-title">История заказов</h2>
                    <div className="history-items">
                      {state.orderHistory.map((order) => (
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
      {state.selectedProduct && (
        <div
          className={`modal-overlay ${state.isProductModalOpen ? "open" : ""}`}
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
                src={state.imageErrors[state.selectedProduct.product.id] ? jpgPlaceholder : cachedImageUrls[state.selectedProduct.product.id]}
                alt={state.selectedProduct.product.name}
                placeholder={jpgPlaceholder}
                className="modal-image"
                loading="eager"
                sizes="(max-width: 600px) 200px, 300px"
                onError={() => handleImageError(state.selectedProduct.product.id)}
                onLoad={() => handleImageLoad(state.selectedProduct.product.id)}
              />
              <div className="modal-info">
                <h1>{state.selectedProduct.product.name}</h1>
                <p>{state.selectedProduct.product.description}</p>
                {hasPriceVariants(state.selectedProduct.product) ? (
                  <div className="variant-selection">
                    <h3>Выберите размер:</h3>
                    {getPriceOptions(state.selectedProduct.product).map((option) => {
                      const discountedPrice = calculateProductPrice(option.price, state.selectedProduct.product.discount_percent);
                      return (
                        <button
                          key={option.key}
                          className={`variant-btn ${state.selectedVariant === option.key ? "selected" : ""}`}
                          onClick={() => dispatch({ type: "SET_STATE", payload: { selectedVariant: option.key } })}
                          aria-pressed={state.selectedVariant === option.key}
                        >
                          {option.label}{" "}
                          {state.selectedProduct.product.discount_percent ? (
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
                  <p>{getDisplayPrice(state.selectedProduct.product, hasPriceVariants)}</p>
                )}
                {hasTasteVariants(state.selectedProduct.product) && (
                  <div className="variant-selection">
                    <h3>Выберите вкус:</h3>
                    {state.selectedProduct.product.variants.map((variant) => (
                      <button
                        key={variant.name}
                        className={`variant-btn ${state.selectedTasteVariant === variant.name ? "selected" : ""}`}
                        onClick={() => dispatch({ type: "SET_STATE", payload: { selectedTasteVariant: variant.name } })}
                        aria-pressed={state.selectedTasteVariant === variant.name}
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
                {state.errorMessage && <p className="error">{state.errorMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Корзина */}
      <Cart cartItems={state.cartItems} onClick={handleCartOpen} />
      {state.isCartOpen && (
        <div className={`cart-panel glass-effect ${state.isCartOpen ? "open" : ""}`} aria-modal="true" role="dialog">
          {state.cartItems.length === 0 ? (
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
                  className={`tab-btn ${!state.isOrderSection ? "active" : ""}`}
                  onClick={() => dispatch({ type: "SET_STATE", payload: { isOrderSection: false } })}
                  aria-selected={!state.isOrderSection}
                >
                  Доставка
                </button>
                <button
                  className={`tab-btn ${state.isOrderSection ? "active" : ""}`}
                  onClick={() => dispatch({ type: "SET_STATE", payload: { isOrderSection: true } })}
                  aria-selected={state.isOrderSection}
                >
                  С собой
                </button>
              </div>
              <div className="cart-items">
                {state.cartItems.map((item) => (
                  <div key={item.id} className="cart-item glass-effect">
                    <LazyImage
                      src={state.imageErrors[item.id] ? jpgPlaceholder : cachedImageUrls[item.id]}
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
                  {state.discount > 0 ? (
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
                    value={state.promoCode}
                    onChange={(e) => dispatch({ type: "SET_STATE", payload: { promoCode: e.target.value } })}
                    aria-label="Ввести промокод"
                  />
                  <button onClick={handlePromoCodeSubmit} aria-label="Применить промокод">
                    Применить
                  </button>
                </div>
                {state.isOrderSection ? (
                  <div className="order-form">
                    <input
                      type="text"
                      name="name"
                      value={state.orderDetails.name}
                      onChange={handleOrderChange}
                      placeholder="Имя"
                      aria-label="Имя"
                      aria-invalid={!!state.formErrors.name}
                    />
                    {state.formErrors.name && <p className="error">{state.formErrors.name}</p>}
                    <input
                      type="text"
                      name="phone"
                      value={state.orderDetails.phone}
                      onChange={handleOrderChange}
                      placeholder="+996123456789"
                      aria-label="Телефон"
                      aria-invalid={!!state.formErrors.phone}
                    />
                    {state.formErrors.phone && <p className="error">{state.formErrors.phone}</p>}
                    <textarea
                      name="comments"
                      value={state.orderDetails.comments}
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
                      value={state.deliveryDetails.name}
                      onChange={handleDeliveryChange}
                      placeholder="Имя"
                      aria-label="Имя"
                      aria-invalid={!!state.formErrors.name}
                    />
                    {state.formErrors.name && <p className="error">{state.formErrors.name}</p>}
                    <input
                      type="text"
                      name="phone"
                      value={state.deliveryDetails.phone}
                      onChange={handleDeliveryChange}
                      placeholder="+996123456789"
                      aria-label="Телефон"
                      aria-invalid={!!state.formErrors.phone}
                    />
                    {state.formErrors.phone && <p className="error">{state.formErrors.phone}</p>}
                    <input
                      type="text"
                      name="address"
                      value={state.deliveryDetails.address}
                      onChange={handleDeliveryChange}
                      placeholder="Адрес доставки"
                      aria-label="Адрес доставки"
                      aria-invalid={!!state.formErrors.address}
                    />
                    {state.formErrors.address && <p className="error">{state.formErrors.address}</p>}
                    <textarea
                      name="comments"
                      value={state.deliveryDetails.comments}
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
      {state.isOrderSent && (
        <div className="order-confirmation glass-effect" role="alert">
          <p>Заказ успешно отправлен!</p>
        </div>
      )}
      {state.isCartNotification && (
        <div className="cart-notification glass-effect" role="alert">
          <p>Товар добавлен в корзину!</p>
        </div>
      )}
    </div>
  );
}

export default Products;