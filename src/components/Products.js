import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useNavigate } from "react-router-dom";
import Cart from "./Cart";
import halal from "../images/halal_png.png";
import { useSwipeable } from "react-swipeable";
import LazyImage from "./LazyImage";
import jpgPlaceholder from "../images/cat.jpg";
import { FiX, FiShoppingCart, FiChevronDown, FiInfo, FiUser, FiMessageSquare, FiLogOut } from "react-icons/fi";
import { auth, db } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";

// Constants
const STORY_DURATION = 5000;
const STORY_INTERVAL = 50;
const BASE_URL = "https://vasyaproger-backentboodai-543a.twc1.net";
const NOTIFICATION_DURATION = 2000;
const CACHE_DURATION = 1000 * 60 * 5;
const DEBOUNCE_DELAY = 200;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CHATBOT_WELCOME = "Здравствуйте! Я ваш помощник по меню. Чем могу помочь?";

// Category priority
const CATEGORY_PRIORITY = [
  "Пиццы", "Половинка_Пиццы", "Комбо", "Сет", "Бургеры", "Шаурмы", "Суши", "Плов", "Десерты", "Блинчики",
  "Закуски", "Восточная_кухня", "Европейская_кухня", "Стейки_и_горячие_блюда", "Горячие_блюда", "Супы",
  "Манты", "Вок", "Гарниры", "Закуски_и_гарниры", "Завтраки", "Детское_меню", "Салаты", "Соусы", "Хлеб",
  "Горячие_напитки", "Напитки", "Лимонады", "Коктейли", "Бабл_ти", "Кофе",
];



// Utilities
const getPriceOptions = (product) => {
  if (!product) return [];
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

const calculateProductPrice = (price, discountPercent, additionalPrice = 0) => {
  const basePrice = Number(price) || 0;
  const discount = Number(discountPercent) || 0;
  const additional = Number(additionalPrice) || 0;
  return (basePrice * (1 - discount / 100)) + additional;
};

const getMinPriceWithDiscount = (product) => {
  if (!product) return 0;
  const priceOptions = getPriceOptions(product);
  const prices = priceOptions.map((option) => calculateProductPrice(option.price, product.discount_percent));
  return prices.length > 0 ? Math.min(...prices) : 0;
};

const getDisplayPrice = (product, hasPriceVariants) => {
  if (!product) return "0.00 сом";
  if (hasPriceVariants(product)) {
    const minPrice = getMinPriceWithDiscount(product);
    return product.discount_percent ? (
      <>
        <span className="line-through text-gray-400">от {Math.min(...getPriceOptions(product).map((opt) => Number(opt.price)))} сом</span>{" "}
        <span className="text-orange-600 font-semibold">от {minPrice.toFixed(2)} сом</span>
      </>
    ) : (
      `от ${Math.min(...getPriceOptions(product).map((opt) => Number(opt.price)))} сом`
    );
  } else {
    const price = Number(product.price_single || product.price || 0);
    const discountedPrice = calculateProductPrice(price, product.discount_percent);
    return product.discount_percent ? (
      <>
        <span className="text-gray-400 line-through">{price.toFixed(2)} сом</span>{" "}
        <span className="text-orange-600 font-semibold">{discountedPrice.toFixed(2)} сом</span>
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

const getDisplayName = (name, language) => {
  if (!name) return "Без названия";
  if (typeof name === "string") return name;
  return name[language] || name.ru || name.en || name.ky || "Без названия";
};

const getDisplayDescription = (description, language) => {
  if (!description) return "Описание отсутствует";
  if (typeof description === "string") return description;
  return description[language] || description.ru || description.en || description.ky || "Описание отсутствует";
};

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    console.warn(`Failed to cache data for key: ${key}`);
  }
};

// Mock AI recommendation logic
const getAIRecommendations = (orderHistory, products) => {
  if (!Array.isArray(orderHistory) || orderHistory.length === 0 || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  const categoriesOrdered = orderHistory.flatMap(order => {
    if (!order || !Array.isArray(order.cartItems)) return [];
    return order.cartItems
      .map(item => {
        const product = products.find(p => getDisplayName(p.name, "ru") === item.name);
        return product?.category;
      })
      .filter(Boolean);
  });

  const categoryCounts = categoriesOrdered.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  if (!topCategory) return products.slice(0, 3);

  return products
    .filter(p => p.category === topCategory && p.category !== "Часто заказывают")
    .slice(0, 3)
    .sort((a, b) => getMinPriceWithDiscount(a) - getMinPriceWithDiscount(b));
};

// Mock chatbot logic
const getChatbotResponse = (message, products) => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("меню") || lowerMessage.includes("что есть")) {
    const categories = [...new Set(products.map(p => p.category))].slice(0, 3);
    return `В нашем меню есть: ${categories.join(", ")}. Хотите рекомендации?`;
  } else if (lowerMessage.includes("рекоменд") || lowerMessage.includes("посоветуй")) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    return `Попробуйте ${getDisplayName(randomProduct.name, "ru")} за ${getMinPriceWithDiscount(randomProduct).toFixed(2)} сом!`;
  } else if (lowerMessage.includes("заказ")) {
    return "Чтобы сделать заказ, добавьте товары в корзину и оформите через неё. Нужна помощь с выбором?";
  } else {
    return "Извините, я не понял. Могу помочь с меню, рекомендациями или заказом!";
  }
};

// Reducer
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

// Retry utility
const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      else throw error;
    }
  }
};

// Main component
function Products() {
  const [state, dispatch] = useReducer(reducer, {
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
    isLoading: false,
    isBranchLoading: false,
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
    boodaiCoins: 0,
    useBoodaiCoins: false,
    language: "ru",
    isChatbotOpen: false,
    chatbotMessages: [{ text: CHATBOT_WELCOME, isBot: true }],
    chatbotInput: "",
  });
  
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const storyTimerRef = useRef(null);
  const modalRef = useRef(null);
  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const chatbotRef = useRef(null);
  const navigate = useNavigate();

  // Firebase Auth state
  const [user, setUser] = useState(null);


  // Определи handleLogout внутри компонента
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      dispatch({ type: "SET_STATE", payload: { boodaiCoins: 0, useBoodaiCoins: false } });
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Ошибка при выходе. Попробуйте снова.");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchBoodaiCoins();
    });
    return () => unsubscribe();
  }, []);

  // Fetch Boodai Coins balance
  const fetchBoodaiCoins = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const coins = userDoc.data().boodaiCoins || 0;
        dispatch({ type: "SET_STATE", payload: { boodaiCoins: coins } });
      }
    } catch (error) {
      console.error("Error fetching Boodai Coins:", error);
    }
  }, []);

  // Login with Google
  const handleLogin = async () => {
    if (user) {
      try {
        await signOut(auth);
        setUser(null);
        dispatch({ type: "SET_STATE", payload: { boodaiCoins: 0, useBoodaiCoins: false } });
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        navigate("/"); // Redirect back to main page after login
      } catch (error) {
        console.error("Error signing in:", error);
        alert("Ошибка входа. Попробуйте снова.");
      }
    }
  };

  // API calls
  const fetchBranches = useCallback(async () => {
    const cacheKey = "branches";
    const cachedBranches = getCachedData(cacheKey);
    if (cachedBranches) {
      dispatch({ type: "SET_STATE", payload: { branches: cachedBranches, isLoading: false } });
      if (!state.selectedBranch && cachedBranches.length > 0) handleBranchSelect(cachedBranches[0].id.toString());
      return;
    }

    dispatch({ type: "SET_STATE", payload: { isLoading: true, error: null } });
    try {
      const url = `${BASE_URL}/api/public/branches`;
      const data = await fetchWithRetry(url, {});
      if (!Array.isArray(data) || data.length === 0) throw new Error("Филиалы не найдены.");
      setCachedData(cacheKey, data);
      dispatch({ type: "SET_STATE", payload: { branches: data } });
      if (!state.selectedBranch && data.length > 0) handleBranchSelect(data[0].id.toString());
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: "Не удалось загрузить филиалы. Проверьте подключение.", branches: [] } });
    } finally {
      dispatch({ type: "SET_STATE", payload: { isLoading: false } });
    }
  }, [state.selectedBranch]);

  const fetchProducts = useCallback(async (branchId) => {
    if (!branchId) return;
    const cacheKey = `products_${branchId}`;
    const cachedProducts = getCachedData(cacheKey);
    if (cachedProducts) {
      const groupedItems = cachedProducts.reduce((acc, product) => {
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
      dispatch({ type: "SET_STATE", payload: { products: cachedProducts, menuItems: sortedCategories, isBranchLoading: false } });
      return;
    }

    dispatch({ type: "SET_STATE", payload: { isBranchLoading: true, error: null } });
    try {
      const url = `${BASE_URL}/api/public/branches/${branchId}/products`;
      const data = await fetchWithRetry(url, {});
      if (!Array.isArray(data)) throw new Error("Неверный формат данных о продуктах.");
      setCachedData(cacheKey, data);
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
      if (Object.keys(sortedCategories).length === 0) dispatch({ type: "SET_STATE", payload: { error: "Продукты не найдены для выбранного филиала." } });
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: "Не удалось загрузить продукты. Попробуйте снова.", products: [], menuItems: {} } });
    } finally {
      dispatch({ type: "SET_STATE", payload: { isBranchLoading: false } });
    }
  }, []);

  const fetchStories = useCallback(async () => {
    const cacheKey = "stories";
    const cachedStories = getCachedData(cacheKey);
    if (cachedStories) {
      dispatch({ type: "SET_STATE", payload: { stories: cachedStories, isLoading: false } });
      return;
    }

    dispatch({ type: "SET_STATE", payload: { isLoading: true } });
    try {
      const url = `${BASE_URL}/api/public/stories`;
      const data = await fetchWithRetry(url, {});
      setCachedData(cacheKey, Array.isArray(data) ? data : []);
      dispatch({ type: "SET_STATE", payload: { stories: Array.isArray(data) ? data : [] } });
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: "Не удалось загрузить истории." } });
    } finally {
      dispatch({ type: "SET_STATE", payload: { isLoading: false } });
    }
  }, []);

  const fetchOrderHistory = useCallback(async (branchId) => {
    if (!branchId) return;
    const cacheKey = `orderHistory_${branchId}`;
    const cachedOrderHistory = getCachedData(cacheKey);
    if (cachedOrderHistory) {
      dispatch({ type: "SET_STATE", payload: { orderHistory: cachedOrderHistory } });
      return;
    }

    try {
      const url = `${BASE_URL}/api/public/branches/${branchId}/orders`;
      const data = await fetchWithRetry(url, {});
      setCachedData(cacheKey, Array.isArray(data) ? data : []);
      dispatch({ type: "SET_STATE", payload: { orderHistory: Array.isArray(data) ? data : [] } });
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { error: "Не удалось загрузить историю заказов." } });
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchBranches().then(() => {
      if (state.selectedBranch) fetchBranchData(state.selectedBranch);
    });
    fetchStories();
    fetchBoodaiCoins();
  }, [fetchBranches, fetchStories, fetchBoodaiCoins, state.selectedBranch]);

  // Concurrent fetching for branch data
  const fetchBranchData = useCallback(
    async (branchId) => {
      if (!branchId) return;
      dispatch({ type: "SET_STATE", payload: { isBranchLoading: true } });
      try {
        await Promise.all([fetchProducts(branchId), fetchOrderHistory(branchId)]);
      } catch (error) {
        dispatch({ type: "SET_STATE", payload: { error: "Ошибка загрузки данных филиала." } });
      } finally {
        dispatch({ type: "SET_STATE", payload: { isBranchLoading: false } });
      }
    },
    [fetchProducts, fetchOrderHistory]
  );

  // Save cart
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    } catch {
      console.warn("Failed to save cart items to localStorage");
    }
  }, [state.cartItems]);

  // Scroll handling for active category
  const handleScroll = useDebouncedCallback(() => {
    let currentCategory = "";
    Object.keys(sectionRefs.current).forEach((category) => {
      const section = sectionRefs.current[category];
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) currentCategory = category;
      }
    });
    if (currentCategory && currentCategory !== state.activeCategory)
      dispatch({ type: "SET_STATE", payload: { activeCategory: currentCategory } });
  }, 100, { leading: false });

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [state.activeCategory]);

  useEffect(() => {
    if (!menuRef.current || !state.activeCategory) return;
    const activeItem = menuRef.current.querySelector(`a[href="#${state.activeCategory}"]`);
    if (activeItem) activeItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [state.activeCategory]);

  // Scroll lock and focus management
  useEffect(() => {
    if (state.isProductModalOpen || state.isCartOpen || state.isStoryModalOpen || state.isBranchModalOpen || state.isChatbotOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
      if (state.isChatbotOpen) chatbotRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [state.isProductModalOpen, state.isCartOpen, state.isStoryModalOpen, state.isBranchModalOpen, state.isChatbotOpen]);

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (state.isProductModalOpen) closeProductModal();
        if (state.isCartOpen) handleCartClose();
        if (state.isStoryModalOpen) closeStoryModal();
        if (state.isBranchModalOpen) dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: false } });
        if (state.isChatbotOpen) handleChatbotClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isProductModalOpen, state.isCartOpen, state.isStoryModalOpen, state.isBranchModalOpen, state.isChatbotOpen]);

  // Stories logic
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
    dispatch({
      type: "SET_STATE",
      payload: {
        currentStoryIndex: index,
        isStoryModalOpen: true,
        progress: 0,
      },
    });
    startStoryTimer();
  }, [startStoryTimer]);

  const closeStoryModal = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: { isStoryModalOpen: false, progress: 0 } });
    clearStoryTimer();
  }, [clearStoryTimer]);

  const goToNextStory = useCallback(() => {
    dispatch({
      type: "SET_STATE",
      payload: {
        viewedStories: new Set(state.viewedStories).add(state.currentStoryIndex),
        currentStoryIndex: state.currentStoryIndex < state.stories.length - 1 ? state.currentStoryIndex + 1 : state.currentStoryIndex,
        progress: 0,
      },
    });
    if (state.currentStoryIndex >= state.stories.length - 1) closeStoryModal();
    else startStoryTimer();
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

  // Product modal swipe handlers
  const productModalSwipeHandlers = useSwipeable({
    onSwipedDown: () => closeProductModal(),
    preventScrollOnSwipe: true,
    delta: 50,
  });

  // Chatbot handlers
  const handleChatbotOpen = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: { isChatbotOpen: true } });
  }, []);

  const handleChatbotClose = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: { isChatbotOpen: false } });
  }, []);

  const handleChatbotSubmit = useCallback(() => {
    if (!state.chatbotInput.trim()) return;
    const userMessage = { text: state.chatbotInput, isBot: false };
    const botResponse = { text: getChatbotResponse(state.chatbotInput, state.products), isBot: true };
    dispatch({
      type: "SET_STATE",
      payload: {
        chatbotMessages: [...state.chatbotMessages, userMessage, botResponse],
        chatbotInput: "",
      },
    });
  }, [state.chatbotInput, state.chatbotMessages, state.products]);

  // Cart handlers
  const handleCartOpen = useCallback(() => dispatch({ type: "SET_STATE", payload: { isCartOpen: true } }), []);
  const handleCartClose = useCallback(() => dispatch({ type: "SET_STATE", payload: { isCartOpen: false } }), []);

  // Product handling
  const hasPriceVariants = useCallback(
    (product) => {
      if (!product) return false;
      const priceFields = [product.price_single, product.price, product.price_small, product.price_medium, product.price_large].filter((price) => price !== undefined && price !== null);
      return priceFields.length > 1;
    },
    []
  );

  const hasTasteVariants = useCallback((product) => product?.variants && product.variants.length > 0, []);

  const handleProductClick = useCallback((product, category) => {
    if (!product) return;
    const priceOptions = getPriceOptions(product);
    const defaultVariant = priceOptions.length > 0 ? priceOptions[0].key : null;
    dispatch({
      type: "SET_STATE",
      payload: { selectedProduct: { product, category }, selectedVariant: defaultVariant, selectedTasteVariant: null, isProductModalOpen: true, errorMessage: "" },
    });
  }, []);

  const handleAddToCart = useCallback(() => {
    try {
      if (!state.selectedProduct?.product) return;
      const priceOptions = getPriceOptions(state.selectedProduct.product);
      if (hasPriceVariants(state.selectedProduct.product) && !state.selectedVariant) throw new Error("Выберите вариант размера.");
      if (hasTasteVariants(state.selectedProduct.product) && !state.selectedTasteVariant) throw new Error("Выберите вариант вкуса.");
      const selectedOption = state.selectedVariant ? priceOptions.find((opt) => opt.key === state.selectedVariant) : priceOptions[0];
      const selectedTaste = state.selectedTasteVariant ? state.selectedProduct.product.variants.find((variant) => variant.name === state.selectedTasteVariant) : null;
      const basePrice = Number(selectedOption?.price) || 0;
      const discountedBasePrice = calculateProductPrice(basePrice, state.selectedProduct.product.discount_percent);
      const additionalPrice = selectedTaste ? Number(selectedTaste.additionalPrice) || 0 : 0;
      const totalPrice = discountedBasePrice + additionalPrice;
      const itemToAdd = {
        id: priceOptions.length > 1 || hasTasteVariants(state.selectedProduct.product)
          ? `${state.selectedProduct.product.id}-${selectedOption.key}-${state.selectedTasteVariant || "default"}`
          : state.selectedProduct.product.id,
        name: priceOptions.length > 1 || hasTasteVariants(state.selectedProduct.product)
          ? `${getDisplayName(state.selectedProduct.product.name, state.language)} (${selectedOption.label}${state.selectedTasteVariant ? `, ${state.selectedTasteVariant}` : ""})`
          : getDisplayName(state.selectedProduct.product.name, state.language),
        price: totalPrice,
        originalPrice: basePrice + additionalPrice,
        discountPercent: state.selectedProduct.product.discount_percent || 0,
        quantity: 1,
        image: state.selectedProduct.product.image_url,
      };
      dispatch({
        type: "SET_STATE",
        payload: {
          cartItems: state.cartItems.find((item) => item.id === itemToAdd.id)
            ? state.cartItems.map((item) => (item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item))
            : [...state.cartItems, itemToAdd],
          isCartNotification: true,
          isProductModalOpen: false,
          selectedProduct: null,
          selectedVariant: null,
          selectedTasteVariant: null,
          errorMessage: "",
        },
      });
      setTimeout(() => dispatch({ type: "SET_STATE", payload: { isCartNotification: false } }), NOTIFICATION_DURATION);
    } catch (error) {
      dispatch({ type: "SET_STATE", payload: { errorMessage: error.message || "Ошибка добавления в корзину" } });
    }
  }, [state.selectedProduct, state.selectedVariant, state.selectedTasteVariant, state.cartItems, state.language]);

  const handleQuantityChange = useCallback(
    (itemId, change) => {
      dispatch({
        type: "SET_STATE",
        payload: {
          cartItems: state.cartItems
            .map((item) => (item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item))
            .filter((item) => item.quantity > 0),
        },
      });
    },
    [state.cartItems]
  );

  // Form handlers
  const handleOrderChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      dispatch({ type: "SET_STATE", payload: { orderDetails: { ...state.orderDetails, [name]: value }, formErrors: { ...state.formErrors, [name]: "" } } });
    },
    [state.orderDetails, state.formErrors]
  );

  const handleDeliveryChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      dispatch({ type: "SET_STATE", payload: { deliveryDetails: { ...state.deliveryDetails, [name]: value }, formErrors: { ...state.formErrors, [name]: "" } } });
    },
    [state.deliveryDetails, state.formErrors]
  );

  // Promo code
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
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Неверный промокод.");
      }
      const data = await response.json();
      dispatch({ type: "SET_STATE", payload: { discount: Number(data.discount) || 0 } });
      alert(`Промокод применен! Скидка ${data.discount}%`);
    } catch (error) {
      alert(error.message || "Ошибка применения промокода");
    }
  }, [state.promoCode]);

  // Validation
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
      let total = state.cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
      total = total * (1 - state.discount / 100);
      let coinsUsed = 0;
      if (state.useBoodaiCoins && auth.currentUser) {
        coinsUsed = Math.min(state.boodaiCoins, total);
        total = Math.max(0, total - coinsUsed);
      }
      const originalTotal = state.cartItems.reduce((sum, item) => sum + (Number(item.originalPrice) || 0) * item.quantity, 0);
      const coinsEarned = originalTotal * 0.05;
      const orderPayload = {
        orderDetails: state.isOrderSection ? state.orderDetails : {},
        deliveryDetails: !state.isOrderSection ? state.deliveryDetails : {},
        cartItems: cartItemsWithPrices,
        discount: state.discount || 0,
        promoCode: state.promoCode || "",
        branchId: parseInt(state.selectedBranch),
        boodaiCoinsUsed: coinsUsed,
        totalAfterCoins: total,
      };
      const response = await fetch(`${BASE_URL}/api/public/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при отправке заказа.");
      }
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const newBalance = state.boodaiCoins - coinsUsed + coinsEarned;
        await updateDoc(userDocRef, { boodaiCoins: newBalance });
        await addDoc(collection(db, "transactions"), {
          userId: auth.currentUser.uid,
          type: "order",
          amount: coinsEarned,
          coinsUsed: coinsUsed,
          orderTotal: originalTotal,
          timestamp: new Date(),
        });
        dispatch({ type: "SET_STATE", payload: { boodaiCoins: newBalance } });
      }
      dispatch({
        type: "SET_STATE",
        payload: {
          isOrderSent: true,
          cartItems: [],
          promoCode: "",
          discount: 0,
          orderDetails: { name: "", phone: "", comments: "" },
          deliveryDetails: { name: "", phone: "", address: "", comments: "" },
          useBoodaiCoins: false,
        },
      });
      localStorage.removeItem("cartItems");
      setTimeout(() => dispatch({ type: "SET_STATE", payload: { isOrderSent: false } }), NOTIFICATION_DURATION);
      fetchOrderHistory(state.selectedBranch);
    } catch (error) {
      alert(error.message || "Ошибка отправки заказа");
    }
  }, [
    state.cartItems,
    state.selectedBranch,
    state.isOrderSection,
    state.orderDetails,
    state.deliveryDetails,
    state.discount,
    state.promoCode,
    state.boodaiCoins,
    state.useBoodaiCoins,
    fetchOrderHistory,
  ]);

  const calculateTotal = useMemo(() => {
    const total = state.cartItems.reduce((sum, item) => sum + (Number(item.originalPrice) || 0) * item.quantity, 0);
    const discountedTotal = state.cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
    let finalTotal = discountedTotal * (1 - state.discount / 100);
    let coinsUsed = 0;
    if (state.useBoodaiCoins && auth.currentUser) {
      coinsUsed = Math.min(state.boodaiCoins, finalTotal);
      finalTotal = Math.max(0, finalTotal - coinsUsed);
    }
    return {
      total: total.toFixed(2),
      discountedTotal: discountedTotal.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      coinsUsed: coinsUsed.toFixed(2),
    };
  }, [state.cartItems, state.discount, state.boodaiCoins, state.useBoodaiCoins]);

  const closeProductModal = useCallback(() => {
    dispatch({ type: "RESET_MODAL" });
  }, []);

  const handleBranchSelect = useDebouncedCallback((branchId) => {
    const branchIdStr = branchId.toString();
    if (state.selectedBranch) {
      localStorage.removeItem(`products_${state.selectedBranch}`);
      localStorage.removeItem(`orderHistory_${state.selectedBranch}`);
    }
    dispatch({
      type: "SET_STATE",
      payload: { selectedBranch: branchIdStr, isBranchModalOpen: false, products: [], menuItems: {}, orderHistory: [], cartItems: [], error: null },
    });
    localStorage.setItem("selectedBranch", branchIdStr);
    localStorage.removeItem("cartItems");
    fetchBranchData(branchIdStr);
  }, DEBOUNCE_DELAY, { leading: false });

  const cachedImageUrls = useMemo(() => {
    const urls = {};
    state.products.forEach((product) => {
      if (product?.image_url) urls[product.id] = getImageUrl(product.image_url);
    });
    state.stories.forEach((story) => {
      if (story?.image) urls[story.id] = getImageUrl(story.image);
    });
    state.cartItems.forEach((item) => {
      if (item?.image) urls[item.id] = getImageUrl(item.image);
    });
    return urls;
  }, [state.products, state.stories, state.cartItems]);

  const handleImageError = useCallback(
    (id) => {
      dispatch({ type: "SET_STATE", payload: { imageErrors: { ...state.imageErrors, [id]: true } } });
    },
    [state.imageErrors]
  );

  const handleImageLoad = useCallback(
    (id) => {
      dispatch({ type: "SET_STATE", payload: { imageErrors: { ...state.imageErrors, [id]: false } } });
    },
    [state.imageErrors]
  );

  const modalPrice = useMemo(() => {
    if (!state.selectedProduct?.product) return 0;
    const priceOptions = getPriceOptions(state.selectedProduct.product);
    const selectedOption = state.selectedVariant ? priceOptions.find((opt) => opt.key === state.selectedVariant) : priceOptions[0];
    const selectedTaste = state.selectedTasteVariant
      ? state.selectedProduct.product.variants.find((variant) => variant.name === state.selectedTasteVariant)
      : null;
    const basePrice = Number(selectedOption?.price) || Number(state.selectedProduct.product.price) || 0;
    const additionalPrice = selectedTaste ? Number(selectedTaste.additionalPrice) || 0 : 0;
    return calculateProductPrice(basePrice, state.selectedProduct.product.discount_percent, additionalPrice);
  }, [state.selectedProduct, state.selectedVariant, state.selectedTasteVariant]);

  const filteredProducts = useMemo(() => {
    if (!state.products || state.products.length === 0) return [];
    return state.products.filter((product) => {
      if (!product || !product.name) return false;
      if (product.category === "Часто заказывают") return false;
      return true;
    });
  }, [state.products]);

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
    return state.products.filter((product) => product?.category === "Часто заказывают").sort((a, b) => {
      const nameA = getDisplayName(a.name, state.language);
      const nameB = getDisplayName(b.name, state.language);
      return nameA.localeCompare(nameB);
    });
  }, [state.products, state.language]);

  const aiRecommendations = useMemo(() => {
    return getAIRecommendations(state.orderHistory, state.products);
  }, [state.orderHistory, state.products]);

  const handleLanguageChange = (lang) => {
    dispatch({ type: "SET_STATE", payload: { language: lang } });
    setIsLanguageOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      {(state.isLoading || state.isBranchLoading) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="text-white text-lg animate-pulse">
            {state.isBranchLoading ? "Загрузка филиала..." : "Загрузка..."}
          </div>
        </div>
      )}
      {state.error && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-3 z-50 animate-slide-down">
          {state.error}
          <button
            onClick={() => fetchBranches()}
            className="ml-4 underline hover:text-gray-200"
            aria-label="Повторить попытку"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Branch selection modal */}
      {state.isBranchModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Выберите филиал</h2>
            {state.branches.length === 0 ? (
              <p className="text-gray-500 text-sm">Филиалы не найдены. Попробуйте позже.</p>
            ) : (
              <div className="space-y-4">
                {state.branches.map((branch) => (
                  <div
                    key={branch.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      state.selectedBranch === branch.id.toString()
                        ? "bg-orange-50 border-orange-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    } border`}
                    onClick={() => handleBranchSelect(branch.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleBranchSelect(branch.id)}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{branch.name || "Без названия"} (ID: {branch.id})</div>
                    <div className="text-xs text-gray-500">{branch.address || "Адрес не указан"}</div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: false } })}
              aria-label="Закрыть модальное окно"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Chatbot */}
      <button
        className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50"
        onClick={handleChatbotOpen}
        aria-label="Открыть чат с помощником"
      >
        <FiMessageSquare size={28} />
      </button>
      {state.isChatbotOpen && (
        <div
          className="fixed bottom-20 right-6 bg-white rounded-3xl shadow-2xl w-96 max-h-[600px] flex flex-col z-50 animate-slide-up"
          aria-modal="true"
          role="dialog"
          ref={chatbotRef}
          tabIndex={-1}
        >
          <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-3xl">
            <h3 className="text-sm font-semibold text-gray-900">Помощник по меню</h3>
            <button
              onClick={handleChatbotClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Закрыть чат"
            >
              <FiX size={24} />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {state.chatbotMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 ${msg.isBot ? "text-left" : "text-right"}`}
              >
                <div
                  className={`inline-block p-3 rounded-xl text-sm ${
                    msg.isBot ? "bg-gray-100 text-gray-900" : "bg-orange-500 text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50 rounded-b-3xl">
            <div className="flex space-x-3">
              <input
                type="text"
                value={state.chatbotInput}
                onChange={(e) => dispatch({ type: "SET_STATE", payload: { chatbotInput: e.target.value } })}
                onKeyDown={(e) => e.key === "Enter" && handleChatbotSubmit()}
                placeholder="Напишите ваш вопрос..."
                className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                aria-label="Ввод сообщения для чат-бота"
              />
              <button
                onClick={handleChatbotSubmit}
                className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 text-sm"
                aria-label="Отправить сообщение"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {state.selectedBranch && (
              <button
                onClick={() => dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: true } })}
                className="flex items-center text-gray-700 hover:text-orange-600 transition-colors text-sm font-medium"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "SET_STATE", payload: { isBranchModalOpen: true } })}
              >
                <span className="font-semibold">
                  {state.branches.find((b) => b.id.toString() === state.selectedBranch)?.name || "Филиал не выбран"}
                </span>
                <FiChevronDown className="ml-2" aria-hidden="true" size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center text-gray-700 hover:text-orange-600 focus:outline-none text-sm font-medium"
                aria-label="Выбрать язык"
              >
                <span className="uppercase font-semibold">{state.language}</span>
                <FiChevronDown className="ml-2" size={20} />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl z-50 animate-fade-in">
                  <button
                    onClick={() => handleLanguageChange("ru")}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-orange-50 text-sm"
                    aria-label="Русский язык"
                  >
                    Русский
                  </button>
                  <button
                    onClick={() => handleLanguageChange("ky")}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-orange-50 text-sm"
                    aria-label="Кыргызский язык"
                  >
                    Кыргызский
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-orange-50 text-sm"
                    aria-label="Английский язык"
                  >
                    Английский
                  </button>
                </div>
              )}
            </div>
            <button
  onClick={user ? handleLogout : () => navigate("/login")}
  className="flex items-center text-gray-700 hover:text-orange-600 text-sm font-medium"
  aria-label={user ? "Выйти" : "Войти"}
>
  {user ? (
    <>
      <FiLogOut size={20} />
      <span className="ml-2">{user.displayName || "Пользователь"}</span>
    </>
  ) : (
    <>
      <FiUser size={20} />
      <span className="ml-2">Войти</span>
    </>
  )}
</button>
          </div>
        </div>
        {state.selectedBranch && Object.keys(sortedFilteredCategories).length > 0 && (
          <nav className="bg-gray-50 overflow-x-auto" ref={menuRef}>
            <ul className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-x-4 py-3">
              {Object.keys(sortedFilteredCategories).map((category) =>
                category !== "Часто заказывают" ? (
                  <li key={category}>
                    <a
                      href={`#${category}`}
                      className={`block px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                        state.activeCategory === category
                          ? "bg-orange-500 text-white"
                          : "text-gray-600 hover:bg-orange-100"
                      }`}
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.selectedBranch ? (
          <div className="space-y-10">
            {state.stories.length > 0 && (
              <section className="stories-section">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Истории</h2>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {state.stories.map((story, index) => (
                    <div
                      key={story.id}
                      className={`flex-none w-24 cursor-pointer transition-opacity duration-300 ${
                        state.viewedStories.has(index) ? "opacity-70" : ""
                      }`}
                      onClick={() => openStoryModal(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openStoryModal(index)}
                    >
                      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-orange-500">
                        <LazyImage
                          src={state.imageErrors[story.id] ? jpgPlaceholder : cachedImageUrls[story.id]}
                          alt={`История от ${new Date(story.created_at).toLocaleDateString()}`}
                          placeholder={jpgPlaceholder}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          sizes="96px"
                          onError={() => handleImageError(story.id)}
                          onLoad={() => handleImageLoad(story.id)}
                        />
                      </div>
                      <p className="text-xs text-center mt-2 text-gray-600">
                        {new Date(story.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {state.isStoryModalOpen && (
              <div
                className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                {...storySwipeHandlers}
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="relative bg-white rounded-3xl max-w-md w-full mx-4 p-6"
                  ref={modalRef}
                  tabIndex={-1}
                >
                  <div className="flex space-x-2 mb-4">
                    {state.stories.map((_, index) => (
                      <div key={index} className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{
                            width: index === state.currentStoryIndex ? `${state.progress}%` : index < state.currentStoryIndex ? "100%" : "0%",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <LazyImage
                    src={
                      state.imageErrors[state.stories[state.currentStoryIndex].id]
                        ? jpgPlaceholder
                        : cachedImageUrls[state.stories[state.currentStoryIndex].id]
                    }
                    alt={`История от ${new Date(state.stories[state.currentStoryIndex].created_at).toLocaleDateString()}`}
                    placeholder={jpgPlaceholder}
                    className="w-full h-96 object-contain rounded-xl"
                    loading="lazy"
                    sizes="(max-width: 600px) 300px, 400px"
                    onError={() => handleImageError(state.stories[state.currentStoryIndex].id)}
                    onLoad={() => handleImageLoad(state.stories[state.currentStoryIndex].id)}
                    onMouseEnter={() => dispatch({ type: "SET_STATE", payload: { isPaused: true } })}
                    onMouseLeave={() => dispatch({ type: "SET_STATE", payload: { isPaused: false } })}
                  />
                  <button
                    className="absolute top-4 right-4 text-white bg-black/60 rounded-full p-2"
                    onClick={closeStoryModal}
                    aria-label="Закрыть сторис"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>
            )}
            <section className="products-section">
              {state.products.length > 0 ? (
                <div>
                  <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-lg">
                    <img src={halal} alt="Халяль" className="w-16 h-16" />
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Халяль</h1>
                      <p className="text-sm text-gray-600">Всё по стандартам</p>
                    </div>
                  </div>
                  {aiRecommendations.length > 0 && (
                    <section className="mt-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Рекомендации для вас</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                        {aiRecommendations.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                            onClick={() => handleProductClick(product, product.category)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && handleProductClick(product, product.category)}
                          >
                            <div className="relative">
                              <LazyImage
                                src={state.imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
                                alt={getDisplayName(product.name, state.language)}
                                placeholder={jpgPlaceholder}
                                className="w-full h-40 object-cover"
                                loading="lazy"
                                sizes="(max-width: 600px) 140px, 180px"
                                onError={() => handleImageError(product.id)}
                                onLoad={() => handleImageLoad(product.id)}
                              />
                              <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                Рекомендуем
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                {getDisplayName(product.name, state.language)}
                              </h3>
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {getDisplayDescription(product.description, state.language)}
                              </p>
                              <p className="text-sm font-medium mt-3">{getDisplayPrice(product, hasPriceVariants)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {bestSellers.length > 0 && (
                    <section className="mt-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Часто заказывают</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                        {bestSellers.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                            onClick={() => handleProductClick(product, "Часто заказывают")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && handleProductClick(product, "Часто заказывают")}
                          >
                            <div className="relative">
                              <LazyImage
                                src={state.imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
                                alt={getDisplayName(product.name, state.language)}
                                placeholder={jpgPlaceholder}
                                className="w-full h-40 object-cover"
                                loading="lazy"
                                sizes="(max-width: 600px) 140px, 180px"
                                onError={() => handleImageError(product.id)}
                                onLoad={() => handleImageLoad(product.id)}
                              />
                              <span className="absolute top-3 left-3 bg-orange-600 text-white text-xs px-3 py-1 rounded-full">
                                Популярное
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                {getDisplayName(product.name, state.language)}
                              </h3>
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {getDisplayDescription(product.description, state.language)}
                              </p>
                              <p className="text-sm font-medium mt-3">{getDisplayPrice(product, hasPriceVariants)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  <section className="menu-items mt-8">
                    {Object.entries(sortedFilteredCategories).length > 0 ? (
                      Object.entries(sortedFilteredCategories).map(([category, items]) =>
                        category !== "Часто заказывают" ? (
                          <div key={category} id={category} className="mb-10" ref={(el) => (sectionRefs.current[category] = el)}>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                              {items.map((product) => (
                                <div
                                  key={product.id}
                                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                                  onClick={() => handleProductClick(product, category)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === "Enter" && handleProductClick(product, category)}
                                >
                                  <LazyImage
                                    src={state.imageErrors[product.id] ? jpgPlaceholder : cachedImageUrls[product.id]}
                                    alt={getDisplayName(product.name, state.language)}
                                    placeholder={jpgPlaceholder}
                                    className="w-full h-40 object-cover"
                                    loading="lazy"
                                    sizes="(max-width: 600px) 140px, 180px"
                                    onError={() => handleImageError(product.id)}
                                    onLoad={() => handleImageLoad(product.id)}
                                  />
                                  <div className="p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                      {getDisplayName(product.name, state.language)}
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                      {getDisplayDescription(product.description, state.language)}
                                    </p>
                                    <p className="text-sm font-medium mt-3">{getDisplayPrice(product, hasPriceVariants)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      )
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-12">Нет доступных категорий</p>
                    )}
                  </section>
                  {state.orderHistory.length > 0 && (
                    <section className="order-history mt-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">История заказов</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.orderHistory.map((order) => (
                          <div key={order.id} className="bg-white rounded-2xl shadow-lg p-4">
                            <p className="font-semibold text-gray-900 text-sm">Заказ #{order.id}</p>
                            <p className="text-gray-600 text-xs mt-2">Сумма: {Number(order.total || 0).toFixed(2)} сом</p>
                            <p className="text-gray-600 text-xs mt-1">Дата: {new Date(order.created_at).toLocaleString()}</p>
                            <p className="text-gray-600 text-xs mt-1">Статус: {order.status || "Неизвестно"}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-12">Продукты не найдены. Попробуйте выбрать другой филиал.</p>
              )}
            </section>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-12">Пожалуйста, выберите филиал для просмотра меню.</p>
        )}
      </main>

      {/* Product Modal */}
      {state.selectedProduct && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeProductModal()}
          aria-modal="true"
          role="dialog"
          {...productModalSwipeHandlers}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full mx-4 p-6 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeProductModal}
              aria-label="Закрыть модальное окно"
            >
              <FiX size={24} />
            </button>
            <button
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
              aria-label="Информация о продукте"
            >
              <FiInfo size={24} />
            </button>
            <div className="space-y-4">
              <LazyImage
                src={
                  state.imageErrors[state.selectedProduct.product.id]
                    ? jpgPlaceholder
                    : cachedImageUrls[state.selectedProduct.product.id]
                }
                alt={getDisplayName(state.selectedProduct.product.name, state.language)}
                placeholder={jpgPlaceholder}
                className="w-full h-64 object-contain rounded-xl"
                loading="eager"
                sizes="(max-width: 600px) 200px, 300px"
                onError={() => handleImageError(state.selectedProduct.product.id)}
                onLoad={() => handleImageLoad(state.selectedProduct.product.id)}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {getDisplayName(state.selectedProduct.product.name, state.language)}
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                  {getDisplayDescription(state.selectedProduct.product.description, state.language)}
                </p>
              </div>
              {hasPriceVariants(state.selectedProduct.product) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Вес и размер:</h3>
                  <div className="flex space-x-3">
                    {getPriceOptions(state.selectedProduct.product).map((option) => (
                      <button
                        key={option.key}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          state.selectedVariant === option.key
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                        }`}
                        onClick={() => dispatch({ type: "SET_STATE", payload: { selectedVariant: option.key } })}
                        aria-pressed={state.selectedVariant === option.key}
                      >
                        {option.label} ({Number(option.price).toFixed(2)} сом)
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {hasTasteVariants(state.selectedProduct.product) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Добавить по вкусу</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {state.selectedProduct.product.variants.map((variant) => (
                      <div
                        key={variant.name}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          state.selectedTasteVariant === variant.name
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:bg-gray-100"
                        } border`}
                        onClick={() => dispatch({ type: "SET_STATE", payload: { selectedTasteVariant: variant.name } })}
                      >
                        <img
                          src={variant.image || jpgPlaceholder}
                          alt={variant.name}
                          className="w-full h-16 object-cover rounded-md mb-2"
                        />
                        <p className="text-sm font-medium text-gray-900">{variant.name}</p>
                        <span className="text-xs text-gray-600">
                          {variant.additionalPrice > 0 ? `+${variant.additionalPrice} сом` : "Бесплатно"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold hover:bg-orange-700 transition-all duration-200 text-sm"
                onClick={handleAddToCart}
                aria-label="Добавить в корзину"
              >
                В корзину за {modalPrice.toFixed(2)} сом
              </button>
              {state.errorMessage && <p className="text-red-600 text-sm">{state.errorMessage}</p>}
            </div>
          </div>
        </div>
      )}

     

      {/* Cart Panel */}
      <Cart cartItems={state.cartItems} onClick={handleCartOpen} />
{state.isCartOpen && (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
    aria-modal="true"
    role="dialog"
  >
    <div className="bg-white/90 rounded-2xl max-w-lg w-full mx-4 p-5 relative animate-fade-in backdrop-blur-lg">
      {state.cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">Корзина пуста</p>
          <button
            className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            onClick={handleCartClose}
            aria-label="Закрыть корзину"
          >
            <FiX size={20} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            onClick={handleCartClose}
            aria-label="Закрыть корзину"
          >
            <FiX size={20} />
          </button>
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 text-center font-medium text-sm ${
                !state.isOrderSection ? "border-b-2 border-orange-500 text-orange-500" : "text-gray-600"
              }`}
              onClick={() => dispatch({ type: "SET_STATE", payload: { isOrderSection: false } })}
              aria-selected={!state.isOrderSection}
            >
              Доставка
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium text-sm ${
                state.isOrderSection ? "border-b-2 border-orange-500 text-orange-500" : "text-gray-600"
              }`}
              onClick={() => dispatch({ type: "SET_STATE", payload: { isOrderSection: true } })}
              aria-selected={state.isOrderSection}
            >
              С собой
            </button>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {state.cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <LazyImage
                    src={state.imageErrors[item.id] ? jpgPlaceholder : cachedImageUrls[item.id]}
                    alt={item.name}
                    placeholder={jpgPlaceholder}
                    className="w-16 h-16 object-cover rounded-md"
                    loading="lazy"
                    sizes="64px"
                    onError={() => handleImageError(item.id)}
                    onLoad={() => handleImageLoad(item.id)}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.discountPercent > 0 ? (
                        <>
                          <span className="line-through">
                            {(item.originalPrice * item.quantity).toFixed(2)} сом
                          </span>{" "}
                          {(item.price * item.quantity).toFixed(2)} сом
                        </>
                      ) : (
                        `${(item.price * item.quantity).toFixed(2)} сом`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="text-gray-600 hover:text-orange-500 text-sm"
                    aria-label={`Уменьшить количество ${item.name}`}
                  >
                    -
                  </button>
                  <span className="text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="text-gray-600 hover:text-orange-500 text-sm"
                    aria-label={`Увеличить количество ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {state.isOrderSection ? (
              <div className="space-y-3">
                <input
                  type="text"
                  name="name"
                  value={state.orderDetails.name}
                  onChange={handleOrderChange}
                  placeholder="Ваше имя"
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    state.formErrors.name ? "border-orange-500" : ""
                  }`}
                  aria-label="Имя для заказа"
                />
                {state.formErrors.name && (
                  <p className="text-orange-600 text-xs">{state.formErrors.name}</p>
                )}
                <input
                  type="tel"
                  name="phone"
                  value={state.orderDetails.phone}
                  onChange={handleOrderChange}
                  placeholder="Телефон (+996123456789)"
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    state.formErrors.phone ? "border-orange-500" : ""
                  }`}
                  aria-label="Телефон для заказа"
                />
                {state.formErrors.phone && (
                  <p className="text-orange-600 text-xs">{state.formErrors.phone}</p>
                )}
                <textarea
                  name="comments"
                  value={state.orderDetails.comments}
                  onChange={handleOrderChange}
                  placeholder="Комментарии к заказу"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  rows="3"
                  aria-label="Комментарии к заказу"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  name="name"
                  value={state.deliveryDetails.name}
                  onChange={handleDeliveryChange}
                  placeholder="Ваше имя"
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    state.formErrors.name ? "border-orange-500" : ""
                  }`}
                  aria-label="Имя для доставки"
                />
                {state.formErrors.name && (
                  <p className="text-orange-600 text-xs">{state.formErrors.name}</p>
                )}
                <input
                  type="tel"
                  name="phone"
                  value={state.deliveryDetails.phone}
                  onChange={handleDeliveryChange}
                  placeholder="Телефон (+996123456789)"
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    state.formErrors.phone ? "border-orange-500" : ""
                  }`}
                  aria-label="Телефон для доставки"
                />
                {state.formErrors.phone && (
                  <p className="text-orange-600 text-xs">{state.formErrors.phone}</p>
                )}
                <input
                  type="text"
                  name="address"
                  value={state.deliveryDetails.address}
                  onChange={handleDeliveryChange}
                  placeholder="Адрес доставки"
                  className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    state.formErrors.address ? "border-orange-500" : ""
                  }`}
                  aria-label="Адрес доставки"
                />
                {state.formErrors.address && (
                  <p className="text-orange-600 text-xs">{state.formErrors.address}</p>
                )}
                <textarea
                  name="comments"
                  value={state.deliveryDetails.comments}
                  onChange={handleDeliveryChange}
                  placeholder="Комментарии к доставке"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  rows="3"
                  aria-label="Комментарии к доставке"
                />
              </div>
            )}
            <div className="flex space-x-2">
              <input
                type="text"
                value={state.promoCode}
                onChange={(e) => dispatch({ type: "SET_STATE", payload: { promoCode: e.target.value } })}
                placeholder="Промокод"
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                aria-label="Ввести промокод"
              />
              <button
                onClick={handlePromoCodeSubmit}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                aria-label="Применить промокод"
              >
                Применить
              </button>
            </div>
            {auth.currentUser && state.boodaiCoins > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={state.useBoodaiCoins}
                  onChange={(e) => dispatch({ type: "SET_STATE", payload: { useBoodaiCoins: e.target.checked } })}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  aria-label="Использовать Boodai Coins"
                />
                <label className="text-sm text-gray-600">
                  Использовать {state.boodaiCoins.toFixed(2)} Boodai Coins
                </label>
              </div>
            )}
            <div className="text-sm space-y-1">
              <p className="flex justify-between">
                <span>Итого:</span>
                <span>{calculateTotal.total} сом</span>
              </p>
              {state.discount > 0 && (
                <p className="flex justify-between text-orange-600">
                  <span>Скидка ({state.discount}%):</span>
                  <span>{calculateTotal.discountedTotal} сом</span>
                </p>
              )}
              {state.useBoodaiCoins && calculateTotal.coinsUsed > 0 && (
                <p className="flex justify-between text-orange-600">
                  <span>Boodai Coins:</span>
                  <span>-{calculateTotal.coinsUsed} сом</span>
                </p>
              )}
              <p className="flex justify-between font-semibold">
                <span>К оплате:</span>
                <span>{calculateTotal.finalTotal} сом</span>
              </p>
            </div>
            <button
              onClick={sendOrderToServer}
              className="w-full bg-orange-500 text-white py-2.5 rounded-full font-semibold hover:bg-orange-600 transition-colors duration-200 text-sm"
              aria-label="Отправить заказ"
            >
              {state.isOrderSection ? "Заказать с собой" : "Заказать доставку"}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>

)}
{state.isOrderSent && (
    <div className="fixed bottom-4 right-4 bg-orange-500 text-white p-3 rounded-lg shadow-lg z-50 animate-slide-up">
      Заказ успешно отправлен!
    </div>
  )}
</div>
);
}


export default Products;