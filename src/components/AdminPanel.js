import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPanel.css";

// Placeholder image
const PLACEHOLDER_IMAGE = "/images/placeholder.png";

// Backend base URL
const BASE_URL = "https://vasyaproger-backentboodai-543a.twc1.net";
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for fetch requests

function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [name, setName] = useState({ ru: "", ky: "", en: "" });
  const [description, setDescription] = useState({ ru: "", ky: "", en: "" });
  const [image, setImage] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState(""); // Новый state для размера
  const [products, setProducts] = useState([]); // Добавляем состояние для products
  const [allProducts, setAllProducts] = useState([]); // Добавляем состояние для allProducts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [promoCodeList, setPromoCodeList] = useState([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: "",
    discountPercent: "",
    expiresAt: "",
    isActive: true,
  });
  const [stories, setStories] = useState([]);
  const [newStoryImage, setNewStoryImage] = useState(null);
  const [newStoryImagePreview, setNewStoryImagePreview] = useState(null);
  const [isStoryEditMode, setIsStoryEditMode] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState({
    image: null,
    title: "",
    description: "",
    buttonText: "",
    promoCodeId: "",
  });
  const [newBannerImagePreview, setNewBannerImagePreview] = useState(null);
  const [isBannerEditMode, setIsBannerEditMode] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [categories, setCategories] = useState([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [branchFormData, setBranchFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
  });
  const [discounts, setDiscounts] = useState([]);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [activeLangTab, setActiveLangTab] = useState("ru");
  // Новые состояния для соусов и остроты
  const [sauces, setSauces] = useState([{ name: "", image: null, imagePreview: null }]);
  const [isSpicy, setIsSpicy] = useState(false);

  const formRef = useRef(null);
  const navigate = useNavigate();

  // Utility to construct image URL with fallback
  const getImageUrl = useCallback(
    (imageKey) => {
      if (!imageKey) return PLACEHOLDER_IMAGE;
      try {
        const key = imageKey.split("/").pop();
        return `${BASE_URL}/product-image/${key}`;
      } catch (err) {
        console.error("Error constructing image URL:", err);
        return PLACEHOLDER_IMAGE;
      }
    },
    []
  );

  // Cache utilities
  const getCachedData = useCallback((key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  }, []);

  const setCachedData = useCallback((key, data) => {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  }, []);

  // Create a fetch with timeout
  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${REQUEST_TIMEOUT}ms`);
      }
      throw error;
    }
  };

  // Token verification
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setIsAuthenticated(false);
        navigate("/admin-login");
        return;
      }
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!response.ok) {
          throw new Error("Invalid token");
        }
        setIsAuthenticated(true);
        setToken(storedToken);
        await fetchInitialData(storedToken);
      } catch (err) {
        console.error("Token verification error:", err);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        setToken("");
        setError(err.message || "Invalid token. Please log in again.");
        navigate("/admin-login");
      }
    };
    verifyToken();
  }, [navigate]);

  // Fetch initial data
  const fetchInitialData = useCallback(
    async (authToken) => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const cacheKeys = {
          branches: "branches",
          categories: "categories",
          users: "users",
          promoCodes: "promoCodes",
          stories: "stories",
          products: "products",
          discounts: "discounts",
          banners: "banners",
        };

        const cachedData = {
          branches: getCachedData(cacheKeys.branches),
          categories: getCachedData(cacheKeys.categories),
          users: getCachedData(cacheKeys.users),
          promoCodes: getCachedData(cacheKeys.promoCodes),
          stories: getCachedData(cacheKeys.stories),
          products: getCachedData(cacheKeys.products),
          discounts: getCachedData(cacheKeys.discounts),
          banners: getCachedData(cacheKeys.banners),
        };

        if (Object.values(cachedData).every((data) => data !== null)) {
          if (typeof setBranches === 'function') setBranches(cachedData.branches);
          if (typeof setCategories === 'function') setCategories(cachedData.categories);
          if (typeof setUsers === 'function') {
            setUsers(
              cachedData.users.map((u) => ({
                user_id: u.id,
                first_name: u.name,
                email: u.email,
              }))
            );
          }
          if (typeof setPromoCodeList === 'function') setPromoCodeList(cachedData.promoCodes);
          if (typeof setStories === 'function') setStories(cachedData.stories);
          if (typeof setProducts === 'function') setProducts(cachedData.products);
          if (typeof setAllProducts === 'function') setAllProducts(cachedData.products);
          if (typeof setDiscounts === 'function') setDiscounts(cachedData.discounts);
          if (typeof setBanners === 'function') setBanners(cachedData.banners);
          return;
        }

        const [
          branchesRes,
          categoriesRes,
          usersRes,
          promoCodesRes,
          storiesRes,
          productsRes,
          discountsRes,
          bannersRes,
        ] = await Promise.all([
          fetchWithTimeout(`${BASE_URL}/branches`, { headers }),
          fetchWithTimeout(`${BASE_URL}/categories`, { headers }),
          fetchWithTimeout(`${BASE_URL}/users`, { headers }),
          fetchWithTimeout(`${BASE_URL}/promo-codes`, { headers }),
          fetchWithTimeout(`${BASE_URL}/stories`, { headers }),
          fetchWithTimeout(`${BASE_URL}/products`, { headers }),
          fetchWithTimeout(`${BASE_URL}/discounts`, { headers }),
          fetchWithTimeout(`${BASE_URL}/banners`, { headers }),
        ]);

        const responses = [
          { res: branchesRes, key: "branches", setter: setBranches },
          { res: categoriesRes, key: "categories", setter: setCategories },
          { res: usersRes, key: "users", setter: setUsers },
          { res: promoCodesRes, key: "promoCodes", setter: setPromoCodeList },
          { res: storiesRes, key: "stories", setter: setStories },
          { res: productsRes, key: "products", setter: setProducts },
          { res: discountsRes, key: "discounts", setter: setDiscounts },
          { res: bannersRes, key: "banners", setter: setBanners },
        ];

        for (const { res, key, setter } of responses) {
          if (!res.ok) {
            throw new Error(`Failed to fetch ${key}: ${res.status}`);
          }
          const data = await res.json();
          setCachedData(cacheKeys[key], Array.isArray(data) ? data : []);
          if (key === "users") {
            setter(
              data.map((u) => ({
                user_id: u.id,
                first_name: u.name,
                email: u.email,
              }))
            );
          } else if (key === "products") {
            setter(data);
            setAllProducts(data);
          } else {
            setter(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        console.error("Fetch initial data error:", error);
        setError(error.message || "Failed to load data");
      }
    },
    [getCachedData, setCachedData]
  );

  // Banner handlers
  const handleBannerImageChange = useCallback((e) => {
    const file = e.target.files[0];
    setNewBanner((prev) => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewBannerImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setNewBannerImagePreview(null);
    }
  }, []);

  const resetBannerForm = useCallback(() => {
    setNewBanner({
      image: null,
      title: "",
      description: "",
      buttonText: "",
      promoCodeId: "",
    });
    setNewBannerImagePreview(null);
    setIsBannerEditMode(false);
    setEditingBannerId(null);
  }, []);

  const handleBannerSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newBanner.image && !isBannerEditMode) {
        alert("Пожалуйста, выберите изображение для баннера!");
        return;
      }
      if (!newBanner.title) {
        alert("Пожалуйста, введите заголовок для баннера!");
        return;
      }

      const formData = new FormData();
      if (newBanner.image) {
        formData.append("image", newBanner.image);
      }
      formData.append("title", newBanner.title);
      formData.append("description", newBanner.description || "");
      formData.append("button_text", newBanner.buttonText || "");
      formData.append("promo_code_id", newBanner.promoCodeId || "");

      try {
        const url = isBannerEditMode
          ? `${BASE_URL}/banners/${editingBannerId}`
          : `${BASE_URL}/banners`;
        const method = isBannerEditMode ? "PUT" : "POST";
        const response = await fetchWithTimeout(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось сохранить баннер");
        }

        const updatedBanner = await response.json();
        if (isBannerEditMode) {
          setBanners(
            banners.map((banner) =>
              banner.id === editingBannerId ? updatedBanner : banner
            )
          );
          alert("Баннер обновлен!");
        } else {
          setBanners([...banners, updatedBanner]);
          setCachedData("banners", [...banners, updatedBanner]);
          alert("Баннер добавлен!");
        }
        resetBannerForm();
      } catch (error) {
        console.error("Banner submit error:", error);
        alert(error.message || "Не удалось сохранить баннер");
      }
    },
    [
      newBanner,
      isBannerEditMode,
      editingBannerId,
      token,
      banners,
      setCachedData,
      resetBannerForm,
    ]
  );

  const handleEditBanner = useCallback(
    (banner) => {
      setIsBannerEditMode(true);
      setEditingBannerId(banner.id);
      setNewBanner({
        image: null,
        title: banner.title || "",
        description: banner.description || "",
        buttonText: banner.button_text || "",
        promoCodeId: banner.promo_code_id || "",
      });
      setNewBannerImagePreview(getImageUrl(banner.image));
    },
    [getImageUrl]
  );

  const handleDeleteBanner = useCallback(
    async (bannerId) => {
      if (!window.confirm("Вы уверены, что хотите удалить этот баннер?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/banners/${bannerId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить баннер");
        }
        setBanners(banners.filter((b) => b.id !== bannerId));
        setCachedData("banners", banners.filter((b) => b.id !== bannerId));
        alert("Баннер удален!");
      } catch (error) {
        console.error("Delete banner error:", error);
        alert(error.message || "Не удалось удалить баннер");
      }
    },
    [banners, token, setCachedData]
  );

  // Story handlers
  const handleStoryImageChange = useCallback((e) => {
    const file = e.target.files[0];
    setNewStoryImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewStoryImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setNewStoryImagePreview(null);
    }
  }, []);

  const resetStoryForm = useCallback(() => {
    setNewStoryImage(null);
    setNewStoryImagePreview(null);
    setIsStoryEditMode(false);
    setEditingStoryId(null);
  }, []);

  const handleStorySubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newStoryImage && !isStoryEditMode) {
        alert("Пожалуйста, выберите изображение для истории!");
        return;
      }

      const formData = new FormData();
      if (newStoryImage) {
        formData.append("image", newStoryImage);
      }

      try {
        const url = isStoryEditMode
          ? `${BASE_URL}/stories/${editingStoryId}`
          : `${BASE_URL}/stories`;
        const method = isStoryEditMode ? "PUT" : "POST";
        const response = await fetchWithTimeout(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось сохранить историю");
        }

        const updatedStory = await response.json();
        if (isStoryEditMode) {
          setStories(
            stories.map((story) =>
              story.id === editingStoryId ? updatedStory : story
            )
          );
        } else {
          setStories([...stories, updatedStory]);
          setCachedData("stories", [...stories, updatedStory]);
        }
        alert(isStoryEditMode ? "История обновлена!" : "История добавлена!");
        resetStoryForm();
      } catch (error) {
        console.error("Story submit error:", error);
        alert(error.message || "Не удалось сохранить историю");
      }
    },
    [
      newStoryImage,
      isStoryEditMode,
      editingStoryId,
      token,
      stories,
      setCachedData,
      resetStoryForm,
    ]
  );

  const handleEditStory = useCallback(
    (story) => {
      setIsStoryEditMode(true);
      setEditingStoryId(story.id);
      setNewStoryImage(null);
      setNewStoryImagePreview(getImageUrl(story.image));
    },
    [getImageUrl]
  );

  const handleDeleteStory = useCallback(
    async (storyId) => {
      if (!window.confirm("Вы уверены, что хотите удалить эту историю?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/stories/${storyId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить историю");
        }
        setStories(stories.filter((s) => s.id !== storyId));
        setCachedData("stories", stories.filter((s) => s.id !== storyId));
        alert("История удалена!");
      } catch (error) {
        console.error("Delete story error:", error);
        alert(error.message || "Не удалось удалить историю");
      }
    },
    [stories, token, setCachedData]
  );

  // Authentication handlers
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, password }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка входа");
        }
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
        setError(null);
        await fetchInitialData(data.token);
        setUsername("");
        setPassword("");
      } catch (error) {
        console.error("Login error:", error);
        setError(error.message || "Не удалось войти");
      }
    },
    [username, password, fetchInitialData]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken("");
    setIsAuthenticated(false);
    navigate("/admin-login");
  }, [navigate]);

  // Product handlers
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }, []);

  // Обработчик для изменения соусов
  const handleSauceChange = useCallback((index, field, value) => {
    setSauces((prev) =>
      prev.map((sauce, i) =>
        i === index ? { ...sauce, [field]: value } : sauce
      )
    );
  }, []);

  const handleSauceImageChange = useCallback((index, e) => {
    const file = e.target.files[0];
    setSauces((prev) =>
      prev.map((sauce, i) => {
        if (i === index) {
          const updatedSauce = { ...sauce, image: file };
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setSauces((prevSauces) =>
                prevSauces.map((s, idx) =>
                  idx === index ? { ...s, imagePreview: reader.result } : s
                )
              );
            };
            reader.readAsDataURL(file);
          } else {
            updatedSauce.imagePreview = null;
          }
          return updatedSauce;
        }
        return sauce;
      })
    );
  }, []);

  const addSauce = useCallback(() => {
    setSauces((prev) => [...prev, { name: "", image: null, imagePreview: null }]);
  }, []);

  const removeSauce = useCallback((index) => {
    setSauces((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setCategoryId(e.target.value);
    setSubCategoryId("");
    setPrice("");
    setSize("");
  }, []);

  const resetFormFields = useCallback(() => {
    setName({ ru: "", ky: "", en: "" });
    setDescription({ ru: "", ky: "", en: "" });
    setImage(null);
    setImagePreview(null);
    setCategoryId("");
    setSubCategoryId("");
    setPrice("");
    setSize("");
    setSauces([{ name: "", image: null, imagePreview: null }]);
    setIsSpicy(false);
    setActiveLangTab("ru");
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      if (!selectedBranch) {
        alert("Пожалуйста, выберите филиал!");
        setIsSubmitting(false);
        return;
      }
      if (!name.ru || !name.ky || !name.en) {
        alert("Пожалуйста, введите название продукта на всех языках!");
        setIsSubmitting(false);
        return;
      }
      if (!categoryId) {
        alert("Пожалуйста, выберите категорию!");
        setIsSubmitting(false);
        return;
      }
      if (!size) {
        alert("Пожалуйста, выберите размер!");
        setIsSubmitting(false);
        return;
      }
      if (!price) {
        alert("Пожалуйста, укажите цену!");
        setIsSubmitting(false);
        return;
      }
      if (!image && !editMode) {
        alert("Пожалуйста, загрузите изображение!");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", JSON.stringify(name));
      formData.append("description", JSON.stringify(description));
      formData.append("branchId", selectedBranch);
      formData.append("categoryId", categoryId);
      formData.append("subCategoryId", subCategoryId || "");
      formData.append("price", price);
      formData.append("size", size);
      formData.append("isSpicy", isSpicy);
      // Добавляем соусы как JSON строку
      const validSauces = sauces.filter((s) => s.name.trim() !== "");
      formData.append("sauces", JSON.stringify(validSauces.map((s) => ({ name: s.name }))));
      if (image) formData.append("image", image);
      // Добавляем изображения соусов
      validSauces.forEach((sauce, index) => {
        if (sauce.image) {
          formData.append(`sauceImage_${index}`, sauce.image);
        }
      });

      try {
        const url = editMode
          ? `${BASE_URL}/products/${editingProductId}`
          : `${BASE_URL}/products`;
        const method = editMode ? "PUT" : "POST";
        const response = await fetchWithTimeout(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось сохранить продукт");
        }

        const newProduct = await response.json();
        if (editMode) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProductId ? newProduct : p))
          );
          setAllProducts((prev) =>
            prev.map((p) => (p.id === editingProductId ? newProduct : p))
          );
        } else {
          setProducts((prev) => [...prev, newProduct]);
          setAllProducts((prev) => [...prev, newProduct]);
          setCachedData("products", [...allProducts, newProduct]);
        }
        setImagePreview(getImageUrl(newProduct.image));
        alert(editMode ? "Продукт обновлен!" : "Продукт добавлен!");
        resetFormFields();
        setEditMode(false);
        setEditingProductId(null);
      } catch (error) {
        console.error("Product submit error:", error);
        alert(error.message || "Не удалось сохранить продукт");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedBranch,
      name,
      description,
      categoryId,
      subCategoryId,
      price,
      size,
      isSpicy,
      sauces,
      image,
      editMode,
      editingProductId,
      token,
      allProducts,
      setCachedData,
      resetFormFields,
      getImageUrl,
    ]
  );

  const handleEdit = useCallback(
    (product) => {
      setEditMode(true);
      setEditingProductId(product.id);
      setName(product.name || { ru: "", ky: "", en: "" });
      setDescription(product.description || { ru: "", ky: "", en: "" });
      setCategoryId(product.category_id);
      setSubCategoryId(product.sub_category_id || "");
      setPrice(product.price || "");
      setSize(product.size || "");
      setIsSpicy(product.isSpicy || false);
      setSauces(
        product.sauces && product.sauces.length > 0
          ? product.sauces.map((s) => ({
              name: s.name,
              image: null,
              imagePreview: s.image ? getImageUrl(s.image) : null,
            }))
          : [{ name: "", image: null, imagePreview: null }]
      );
      setImage(null);
      setImagePreview(getImageUrl(product.image));
      setSelectedBranch(product.branch_id);

      formRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [getImageUrl]
  );

  const handleDelete = useCallback(
    async (productId) => {
      if (!window.confirm("Вы уверены, что хотите удалить этот продукт?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/products/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить продукт");
        }
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setAllProducts((prev) => prev.filter((p) => p.id !== productId));
        setCachedData(
          "products",
          allProducts.filter((p) => p.id !== productId)
        );
        alert("Продукт удален!");
      } catch (error) {
        console.error("Delete product error:", error);
        alert(error.message || "Не удалось удалить продукт");
      }
    },
    [allProducts, token, setCachedData]
  );

  // Branch handlers
  const openBranchModal = useCallback(
    (branch = null) => {
      setCurrentBranch(branch);
      setBranchFormData(
        branch
          ? { name: branch.name, address: branch.address || "", phone: branch.phone || "" }
          : { name: "", address: "", phone: "" }
      );
      setIsBranchModalOpen(true);
    },
    []
  );

  const closeBranchModal = useCallback(() => {
    setIsBranchModalOpen(false);
    setCurrentBranch(null);
  }, []);

  const handleBranchInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setBranchFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const saveBranch = useCallback(
    async () => {
      try {
        const method = currentBranch ? "PUT" : "POST";
        const url = currentBranch
          ? `${BASE_URL}/branches/${currentBranch.id}`
          : `${BASE_URL}/branches`;
        const response = await fetchWithTimeout(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(branchFormData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось сохранить филиал");
        }

        const data = await response.json();
        if (currentBranch) {
          setBranches(branches.map((b) => (b.id === data.id ? data : b)));
        } else {
          setBranches([...branches, data]);
          setCachedData("branches", [...branches, data]);
        }
        closeBranchModal();
        alert("Филиал сохранен!");
      } catch (error) {
        console.error("Save branch error:", error);
        alert(error.message || "Не удалось сохранить филиал");
      }
    },
    [currentBranch, branchFormData, token, branches, setCachedData, closeBranchModal]
  );

  const deleteBranch = useCallback(
    async (id) => {
      if (!window.confirm("Вы уверены, что хотите удалить этот филиал?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/branches/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить филиал");
        }
        setBranches(branches.filter((b) => b.id !== id));
        setCachedData("branches", branches.filter((b) => b.id !== id));
        if (selectedBranch === id) setSelectedBranch("");
        alert("Филиал удален!");
      } catch (error) {
        console.error("Delete branch error:", error);
        alert(error.message || "Не удалось удалить филиал");
      }
    },
    [branches, token, selectedBranch, setCachedData]
  );

  // Category handlers
  const openCategoryModal = useCallback(
    (category = null) => {
      setCurrentCategory(category);
      setCategoryFormData(category ? { name: category.name } : { name: "" });
      setIsCategoryModalOpen(true);
    },
    []
  );

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setCurrentCategory(null);
  }, []);

  const handleCategoryInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const saveCategory = useCallback(
    async () => {
      try {
        const method = currentCategory ? "PUT" : "POST";
        const url = currentCategory
          ? `${BASE_URL}/categories/${currentCategory.id}`
          : `${BASE_URL}/categories`;
        const response = await fetchWithTimeout(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryFormData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось сохранить категорию");
        }

        const data = await response.json();
        if (currentCategory) {
          setCategories(categories.map((c) => (c.id === data.id ? data : c)));
        } else {
          setCategories([...categories, data]);
          setCachedData("categories", [...categories, data]);
        }
        closeCategoryModal();
        alert("Категория сохранена!");
      } catch (error) {
        console.error("Save category error:", error);
        alert(error.message || "Не удалось сохранить категорию");
      }
    },
    [currentCategory, categoryFormData, token, categories, setCachedData, closeCategoryModal]
  );

  const deleteCategory = useCallback(
    async (id) => {
      if (!window.confirm("Вы уверены, что хотите удалить эту категорию?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/categories/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить категорию");
        }
        setCategories(categories.filter((c) => c.id !== id));
        setCachedData("categories", categories.filter((c) => c.id !== id));
        alert("Категория удалена!");
      } catch (error) {
        console.error("Delete category error:", error);
        alert(error.message || "Не удалось удалить категорию");
      }
    },
    [categories, token, setCachedData]
  );

  // Promo code handlers
  const handleAddPromoCode = useCallback(
    async () => {
      if (!newPromoCode.code || !newPromoCode.discountPercent) {
        alert("Пожалуйста, введите код и процент скидки!");
        return;
      }

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/promo-codes`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPromoCode),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось добавить промокод");
        }
        const data = await response.json();
        setPromoCodeList([...promoCodeList, data]);
        setCachedData("promoCodes", [...promoCodeList, data]);
        setNewPromoCode({
          code: "",
          discountPercent: "",
          expiresAt: "",
          isActive: true,
        });
        alert("Промокод добавлен!");
      } catch (error) {
        console.error("Add promo code error:", error);
        alert(error.message || "Не удалось добавить промокод");
      }
    },
    [newPromoCode, token, promoCodeList, setCachedData]
  );

  const handleEditPromoCode = useCallback(
    async (promo) => {
      setNewPromoCode({
        code: promo.code,
        discountPercent: promo.discount_percent,
        expiresAt: promo.expires_at ? promo.expires_at.slice(0, 16) : "",
        isActive: promo.is_active,
      });
    },
    []
  );

  const handleDeletePromoCode = useCallback(
    async (id) => {
      if (!window.confirm("Вы уверены, что хотите удалить этот промокод?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/promo-codes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить промокод");
        }
        setPromoCodeList(promoCodeList.filter((p) => p.id !== id));
        setCachedData("promoCodes", promoCodeList.filter((p) => p.id !== id));
        alert("Промокод удален!");
      } catch (error) {
        console.error("Delete promo code error:", error);
        alert(error.message || "Не удалось удалить промокод");
      }
    },
    [promoCodeList, token, setCachedData]
  );

  // Discount handlers
  const handleAddDiscount = useCallback(
    async () => {
      if (!selectedProductForDiscount || !discountPercent) {
        alert("Пожалуйста, выберите продукт и укажите процент скидки!");
        return;
      }
      if (discountPercent < 1 || discountPercent > 100) {
        alert("Процент скидки должен быть от 1 до 100!");
        return;
      }

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/discounts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: selectedProductForDiscount,
            discountPercent,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось добавить скидку");
        }
        const data = await response.json();
        setDiscounts([...discounts, data]);
        setCachedData("discounts", [...discounts, data]);
        setSelectedProductForDiscount("");
        setDiscountPercent("");
        alert("Скидка добавлена!");
      } catch (error) {
        console.error("Add discount error:", error);
        alert(error.message || "Не удалось добавить скидку");
      }
    },
    [selectedProductForDiscount, discountPercent, token, discounts, setCachedData]
  );

  const handleDeleteDiscount = useCallback(
    async (discountId) => {
      if (!window.confirm("Вы уверены, что хотите удалить эту скидку?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/discounts/${discountId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить скидку");
        }
        setDiscounts(discounts.filter((d) => d.id !== discountId));
        setCachedData("discounts", discounts.filter((d) => d.id !== discountId));
        alert("Скидка удалена!");
      } catch (error) {
        console.error("Delete discount error:", error);
        alert(error.message || "Не удалось удалить скидку");
      }
    },
    [discounts, token, setCachedData]
  );

  // User handlers
  const handleDeleteUser = useCallback(
    async (userId) => {
      if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

      try {
        const response = await fetchWithTimeout(`${BASE_URL}/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Не удалось удалить пользователя");
        }
        setUsers((prev) => prev.filter((u) => u.user_id !== userId));
        setCachedData(
          "users",
          users.filter((u) => u.user_id !== userId)
        );
        alert("Пользователь удален!");
      } catch (error) {
        console.error("Delete user error:", error);
        alert(error.message || "Не удалось удалить пользователя");
      }
    },
    [users, token, setCachedData]
  );

  // Memoized render functions
  const renderUsersSection = useMemo(
    () => {
      const filteredUsers = users.filter((user) =>
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return (
        <div className="users-section p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Пользователи <span className="text-gray-500">({filteredUsers.length})</span>
          </h2>
          <input
            type="text"
            placeholder="Поиск по имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.slice(0, 10).map((user) => (
                <div key={user.user_id} className="glass-effect p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-800">{user.first_name}</h3>
                  <p className="text-gray-600">Email: {user.email}</p>
                  <button
                    onClick={() => handleDeleteUser(user.user_id)}
                    className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    Удалить
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Пользователи не найдены</p>
            )}
          </div>
        </div>
      );
    },
    [users, searchQuery, handleDeleteUser]
  );

  const renderPriceFields = useMemo(
    () => {
      if (!categoryId) return null;
      return (
        <>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Размер:</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите размер</option>
              <option value="small">Маленький</option>
              <option value="medium">Средний</option>
              <option value="large">Большой</option>
            </select>
          </div>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Цена (сом):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="form-group mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isSpicy}
                onChange={(e) => setIsSpicy(e.target.checked)}
                className="mr-2"
              />
              Острый
            </label>
          </div>
        </>
      );
    },
    [categoryId, size, price, isSpicy]
  );

  const renderSaucesFields = useMemo(
    () => (
      <div className="form-group mb-4">
        <label className="block text-gray-700 font-medium mb-2">Соусы/Ингредиенты (необязательно):</label>
        {sauces.map((sauce, index) => (
          <div key={index} className="sauce-item mb-4 border-b border-gray-300 pb-4">
            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">Название соуса:</label>
              <input
                type="text"
                value={sauce.name}
                onChange={(e) => handleSauceChange(index, "name", e.target.value)}
                placeholder="Введите название соуса"
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">Изображение соуса (необязательно):</label>
              {sauce.imagePreview && (
                <div className="image-preview-container mb-4">
                  <img
                    src={sauce.imagePreview}
                    alt="Sauce preview"
                    className="image-preview rounded-lg"
                    onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                  />
                </div>
              )}
              <input
                type="file"
                onChange={(e) => handleSauceImageChange(index, e)}
                accept="image/*"
                className="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>
            {sauces.length > 1 && (
              <button
                type="button"
                onClick={() => removeSauce(index)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition mt-2"
              >
                Удалить соус
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addSauce}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Добавить соус
        </button>
      </div>
    ),
    [sauces, handleSauceChange, handleSauceImageChange, addSauce, removeSauce]
  );

  const renderBannersSection = useMemo(
    () => (
      <div className="banners-section p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Баннеры</h2>
        <form onSubmit={handleBannerSubmit} className="glass-effect p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">
            {isBannerEditMode ? "Редактировать баннер" : "Добавить новый баннер"}
          </h3>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Заголовок:</label>
            <input
              type="text"
              value={newBanner.title}
              onChange={(e) =>
                setNewBanner({ ...newBanner, title: e.target.value })
              }
              required
              placeholder="Введите заголовок баннера"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Описание:</label>
            <textarea
              value={newBanner.description}
              onChange={(e) =>
                setNewBanner({ ...newBanner, description: e.target.value })
              }
              placeholder="Введите описание баннера (необязательно)"
              rows="4"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Текст кнопки:</label>
            <input
              type="text"
              value={newBanner.buttonText}
              onChange={(e) =>
                setNewBanner({ ...newBanner, buttonText: e.target.value })
              }
              placeholder="Введите текст кнопки (например, Заказать)"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Промокод:</label>
            <select
              value={newBanner.promoCodeId}
              onChange={(e) =>
                setNewBanner({ ...newBanner, promoCodeId: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите промокод (необязательно)</option>
              {promoCodeList.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.code} ({promo.discount_percent}% скидка)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Изображение:</label>
            {newBannerImagePreview && (
              <div className="image-preview-container mb-4">
                <img
                  src={newBannerImagePreview}
                  alt="Предпросмотр баннера"
                  className="image-preview rounded-lg"
                  onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                />
              </div>
            )}
            <input
              type="file"
              onChange={handleBannerImageChange}
              accept="image/*"
              required={!isBannerEditMode}
              className="w-full p-3 rounded-lg border border-gray-300"
            />
            <small className="text-gray-500">Выберите одно изображение</small>
          </div>
          <div className="form-buttons flex space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {isBannerEditMode ? "Обновить" : "Добавить"}
            </button>
            {isBannerEditMode && (
              <button
                type="button"
                onClick={resetBannerForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        <div className="banners-list">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Список баннеров</h3>
          {banners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="glass-effect p-4 rounded-lg shadow-md">
                  {banner.image ? (
                    <img
                      src={getImageUrl(banner.image)}
                      alt={banner.title || "Баннер"}
                      className="product-image rounded-lg mb-4"
                      onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="no-image bg-gray-200 text-gray-500 p-4 rounded-lg mb-4">
                      Нет изображения
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-gray-800">{banner.title || `Баннер ID: ${banner.id}`}</h3>
                  <p className="text-gray-600">{banner.description || "Нет описания"}</p>
                  <p className="text-gray-600">Кнопка: {banner.button_text || "Нет"}</p>
                  <p className="text-gray-600">
                    Промокод: {banner.promo_code?.code || "Нет"} (
                    {banner.promo_code?.discount_percent || 0}% скидка)
                  </p>
                  <p className="text-gray-600">
                    Создан: {new Date(banner.created_at).toLocaleString()}
                  </p>
                  <div className="product-buttons flex space-x-2 mt-4">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      onClick={() => handleEditBanner(banner)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      onClick={() => handleDeleteBanner(banner.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Баннеры отсутствуют</p>
          )}
        </div>
      </div>
    ),
    [
      banners,
      newBanner,
      newBannerImagePreview,
      isBannerEditMode,
      promoCodeList,
      handleBannerSubmit,
      handleBannerImageChange,
      resetBannerForm,
      handleEditBanner,
      handleDeleteBanner,
      getImageUrl,
    ]
  );

  const renderStoriesSection = useMemo(
    () => (
      <div className="stories-section p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Истории</h2>
        <form onSubmit={handleStorySubmit} className="glass-effect p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">
            {isStoryEditMode ? "Редактировать историю" : "Добавить историю"}
          </h3>
          <div className="form-group mb-4">
            <label className="block text-gray-700 font-medium mb-1">Изображение:</label>
            {newStoryImagePreview && (
              <div className="image-preview-container mb-4">
                <img
                  src={newStoryImagePreview}
                  alt="Предпросмотр истории"
                  className="image-preview rounded-lg"
                  onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                />
              </div>
            )}
            <input
              type="file"
              onChange={handleStoryImageChange}
              accept="image/*"
              required={!isStoryEditMode}
              className="w-full p-3 rounded-lg border border-gray-300"
            />
          </div>
          <div className="form-buttons flex space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {isStoryEditMode ? "Обновить" : "Добавить"}
            </button>
            {isStoryEditMode && (
              <button
                type="button"
                onClick={resetStoryForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        <div className="stories-list">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Список историй</h3>
          {stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <div key={story.id} className="glass-effect p-4 rounded-lg shadow-md">
                  {story.image ? (
                    <img
                      src={getImageUrl(story.image)}
                      alt="История"
                      className="product-image rounded-lg mb-4"
                      onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="no-image bg-gray-200 text-gray-500 p-4 rounded-lg mb-4">
                      Нет изображения
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-gray-800">История ID: {story.id}</h3>
                  <p className="text-gray-600">
                    Создана: {new Date(story.created_at).toLocaleString()}
                  </p>
                  <div className="product-buttons flex space-x-2 mt-4">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      onClick={() => handleEditStory(story)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      onClick={() => handleDeleteStory(story.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Истории отсутствуют</p>
          )}
        </div>
      </div>
    ),
    [
      stories,
      newStoryImagePreview,
      isStoryEditMode,
      handleStorySubmit,
      handleStoryImageChange,
      resetStoryForm,
      handleEditStory,
      handleDeleteStory,
      getImageUrl,
    ]
  );

  const renderBranchesSection = useMemo(
    () => (
      <div className="branches-section p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Филиалы</h2>
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition mb-4"
          onClick={() => openBranchModal()}
        >
          Добавить филиал
        </button>
        <table className="admin-table glass-effect w-full rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Название</th>
              <th className="p-3 text-left">Адрес</th>
              <th className="p-3 text-left">Телефон</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b border-gray-200">
                <td className="p-3">{branch.name}</td>
                <td className="p-3">{branch.address || "Н/Д"}</td>
                <td className="p-3">{branch.phone || "Н/Д"}</td>
                <td className="p-3">
                  <button
                    className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition mr-2"
                    onClick={() => openBranchModal(branch)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                    onClick={() => deleteBranch(branch.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isBranchModalOpen && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content glass-effect p-6 rounded-lg shadow-md max-w-md w-full">
              <h3 className="text-xl font-medium text-gray-800 mb-4">
                {currentBranch ? "Редактировать филиал" : "Добавить филиал"}
              </h3>
              <div className="form-group mb-4">
                <label className="block text-gray-700 font-medium mb-1">Название:</label>
                <input
                  type="text"
                  name="name"
                  value={branchFormData.name}
                  onChange={handleBranchInputChange}
                  required
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="form-group mb-4">
                <label className="block text-gray-700 font-medium mb-1">Адрес:</label>
                <input
                  type="text"
                  name="address"
                  value={branchFormData.address}
                  onChange={handleBranchInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="form-group mb-4">
                <label className="block text-gray-700 font-medium mb-1">Телефон:</label>
                <input
                  type="text"
                  name="phone"
                  value={branchFormData.phone}
                  onChange={handleBranchInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="modal-buttons flex space-x-4">
                <button
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                  onClick={saveBranch}
                >
                  Сохранить
                </button>
                <button
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                  onClick={closeBranchModal}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    [
      branches,
      branchFormData,
      currentBranch,
      isBranchModalOpen,
      openBranchModal,
      handleBranchInputChange,
      saveBranch,
      closeBranchModal,
      deleteBranch,
    ]
  );

  const renderCategoriesSection = useMemo(
    () => (
      <div className="categories-section p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Категории</h2>
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition mb-4"
          onClick={() => openCategoryModal()}
        >
          Добавить категорию
        </button>
        <table className="admin-table glass-effect w-full rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Название</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-200">
                <td className="p-3">{cat.name}</td>
                <td className="p-3">
                  <button
                    className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition mr-2"
                    onClick={() => openCategoryModal(cat)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                    onClick={() => deleteCategory(cat.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isCategoryModalOpen && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content glass-effect p-6 rounded-lg shadow-md max-w-md w-full">
              <h3 className="text-xl font-medium text-gray-800 mb-4">
                {currentCategory ? "Редактировать категорию" : "Добавить категорию"}
              </h3>
              <div className="form-group mb-4">
                <label className="block text-gray-700 font-medium mb-1">Название:</label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  required
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="modal-buttons flex space-x-4">
                <button
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                  onClick={saveCategory}
                >
                  Сохранить
                </button>
                <button
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                  onClick={closeCategoryModal}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    [
      categories,
      categoryFormData,
      currentCategory,
      isCategoryModalOpen,
      openCategoryModal,
      handleCategoryInputChange,
      saveCategory,
      closeCategoryModal,
      deleteCategory,
    ]
  );

  const renderPromoCodesSection = useMemo(
    () => (
      <div className="promo-codes-section p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Промокоды</h2>
        <div className="promo-code-form glass-effect p-6 rounded-lg shadow-md mb-6">
          <input
            type="text"
            placeholder="Код (например, SUMMER)"
            value={newPromoCode.code}
            onChange={(e) =>
              setNewPromoCode({ ...newPromoCode, code: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <input
            type="number"
            placeholder="Скидка (%)"
            min="0"
            max="100"
            value={newPromoCode.discountPercent}
            onChange={(e) =>
              setNewPromoCode({
                ...newPromoCode,
                discountPercent: e.target.value,
              })
            }
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <input
            type="datetime-local"
            value={newPromoCode.expiresAt}
            onChange={(e) =>
              setNewPromoCode({ ...newPromoCode, expiresAt: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={newPromoCode.isActive}
              onChange={(e) =>
                setNewPromoCode({ ...newPromoCode, isActive: e.target.checked })
              }
              className="mr-2"
            />
            Активен
          </label>
          <button
            onClick={handleAddPromoCode}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Добавить промокод
          </button>
        </div>
        <table className="admin-table glass-effect w-full rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Код</th>
              <th className="p-3 text-left">Скидка (%)</th>
              <th className="p-3 text-left">Истекает</th>
              <th className="p-3 text-left">Активен</th>
              <th className="p-3 text-left">Создан</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {promoCodeList.map((promo) => (
              <tr key={promo.id} className="border-b border-gray-200">
                <td className="p-3">{promo.code}</td>
                <td className="p-3">{promo.discount_percent}</td>
                <td className="p-3">
                  {promo.expires_at
                    ? new Date(promo.expires_at).toLocaleString()
                    : "Н/Д"}
                </td>
                <td className="p-3">{promo.is_active ? "Да" : "Нет"}</td>
                <td className="p-3">{new Date(promo.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <button
                    className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition mr-2"
                    onClick={() => handleEditPromoCode(promo)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                    onClick={() => handleDeletePromoCode(promo.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [
      newPromoCode,
      promoCodeList,
      handleAddPromoCode,
      handleEditPromoCode,
      handleDeletePromoCode,
    ]
  );

  const renderDiscountsSection = useMemo(
    () => {
      if (allProducts.length === 0) {
        return (
          <div className="discounts-section p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Скидки</h2>
            <p className="text-gray-500">Нет продуктов для добавления скидок.</p>
          </div>
        );
      }
      return (
        <div className="discounts-section p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Скидки</h2>
          <div className="discount-form glass-effect p-6 rounded-lg shadow-md mb-6">
            <select
              value={selectedProductForDiscount}
              onChange={(e) => setSelectedProductForDiscount(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="">Выберите продукт</option>
              {allProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name[navigator.language.split('-')[0] || "en"]} (Филиал: {branches.find((b) => b.id === product.branch_id)?.name || "Неизвестно"})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Процент скидки"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleAddDiscount}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Добавить скидку
            </button>
          </div>
          <table className="admin-table glass-effect w-full rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Продукт</th>
                <th className="p-3 text-left">Скидка (%)</th>
                <th className="p-3 text-left">Создано</th>
                <th className="p-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
            {discounts.map((discount) => (
                <tr key={discount.id} className="border-b border-gray-200">
                  <td className="p-3">{discount.product_name}</td>
                  <td className="p-3">{discount.discount_percent}</td>
                  <td className="p-3">{new Date(discount.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                      onClick={() => handleDeleteDiscount(discount.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
    [
      allProducts,
      selectedProductForDiscount,
      discountPercent,
      discounts,
      branches,
      handleAddDiscount,
      handleDeleteDiscount,
    ]
  );

  // Products section
  const renderProductsSection = useMemo(
    () => {
      const filteredProducts = products.filter((product) =>
        product.name.ru.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return (
        <div className="products-section p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Продукты <span className="text-gray-500">({filteredProducts.length})</span>
          </h2>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          />
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="product-form glass-effect p-6 rounded-lg shadow-md mb-6"
          >
            <h3 className="text-xl font-medium text-gray-800 mb-4">
              {editMode ? "Редактировать продукт" : "Добавить продукт"}
            </h3>

            {/* Language Tabs */}
            <div className="lang-tabs flex space-x-2 mb-4">
              {["ru", "ky", "en"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`px-4 py-2 rounded-lg ${
                    activeLangTab === lang
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setActiveLangTab(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Name Input */}
            <div className="form-group mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Название ({activeLangTab.toUpperCase()}):
              </label>
              <input
                type="text"
                value={name[activeLangTab]}
                onChange={(e) =>
                  setName({ ...name, [activeLangTab]: e.target.value })
                }
                required
                placeholder={`Введите название на ${activeLangTab}`}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description Input */}
            <div className="form-group mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Описание ({activeLangTab.toUpperCase()}):
              </label>
              <textarea
                value={description[activeLangTab]}
                onChange={(e) =>
                  setDescription({
                    ...description,
                    [activeLangTab]: e.target.value,
                  })
                }
                placeholder={`Введите описание на ${activeLangTab}`}
                rows="4"
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Branch Selection */}
            <div className="form-group mb-4">
              <label className="block text-gray-700 font-medium mb-1">Филиал:</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите филиал</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div className="form-group mb-4">
              <label className="block text-gray-700 font-medium mb-1">Категория:</label>
              <select
                value={categoryId}
                onChange={handleCategoryChange}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Selection */}
            {categoryId && (
              <div className="form-group mb-4">
                <label className="block text-gray-700 font-medium mb-1">
                  Подкатегория (необязательно):
                </label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Без подкатегории</option>
                  {categories
                    .find((cat) => cat.id === categoryId)
                    ?.sub_categories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Price and Size Fields */}
            {renderPriceFields}

            {/* Sauces/Ingredients Fields */}
            {renderSaucesFields}

            {/* Image Upload */}
            <div className="form-group mb-4">
              <label className="block text-gray-700 font-medium mb-1">Изображение:</label>
              {imagePreview && (
                <div className="image-preview-container mb-4">
                  <img
                    src={imagePreview}
                    alt="Предпросмотр продукта"
                    className="image-preview rounded-lg"
                    onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                  />
                </div>
              )}
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                required={!editMode}
                className="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>

            {/* Form Buttons */}
            <div className="form-buttons flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting
                  ? "Сохранение..."
                  : editMode
                  ? "Обновить продукт"
                  : "Добавить продукт"}
              </button>
              {editMode && (
                <button
                  type="button"
                  onClick={() => {
                    resetFormFields();
                    setEditMode(false);
                    setEditingProductId(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          {/* Products List */}
          <div className="products-list">
            <h3 className="text-xl font-medium text-gray-800 mb-4">Список продуктов</h3>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="glass-effect p-4 rounded-lg shadow-md">
                    {product.image ? (
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name.ru || "Продукт"}
                        className="product-image rounded-lg mb-4"
                        onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-image bg-gray-200 text-gray-500 p-4 rounded-lg mb-4">
                        Нет изображения
                      </div>
                    )}
                    <h3 className="text-lg font-medium text-gray-800">
                      {product.name.ru || `Продукт ID: ${product.id}`}
                    </h3>
                    <p className="text-gray-600">
                      Описание: {product.description.ru || "Нет описания"}
                    </p>
                    <p className="text-gray-600">Филиал: {branches.find((b) => b.id === product.branch_id)?.name || "Неизвестно"}</p>
                    <p className="text-gray-600">Категория: {categories.find((c) => c.id === product.category_id)?.name || "Неизвестно"}</p>
                    <p className="text-gray-600">Размер: {product.size === "small" ? "Маленький" : product.size === "medium" ? "Средний" : "Большой"}</p>
                    <p className="text-gray-600">Цена: {product.price} сом</p>
                    <p className="text-gray-600">Острый: {product.isSpicy ? "Да" : "Нет"}</p>
                    <p className="text-gray-600">
                      Соусы: {product.sauces?.length > 0 ? product.sauces.map((s) => s.name).join(", ") : "Нет"}
                    </p>
                    <p className="text-gray-600">
                      Создан: {new Date(product.created_at).toLocaleString()}
                    </p>
                    <div className="product-buttons flex space-x-2 mt-4">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        onClick={() => handleEdit(product)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        onClick={() => handleDelete(product.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Продукты не найдены</p>
            )}
          </div>
        </div>
      );
    },
    [
      products,
      searchQuery,
      editMode,
      isSubmitting,
      name,
      description,
      selectedBranch,
      categoryId,
      subCategoryId,
      price,
      size,
      isSpicy,
      sauces,
      imagePreview,
      activeLangTab,
      branches,
      categories,
      handleSubmit,
      handleCategoryChange,
      handleImageChange,
      handleEdit,
      handleDelete,
      resetFormFields,
      getImageUrl,
      renderPriceFields,
      renderSaucesFields,
    ]
  );

  // Main render
  if (!isAuthenticated) {
    return (
      <div className="login-container flex items-center justify-center min-h-screen bg-gray-100">
        <div className="glass-effect p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Вход в админ-панель
          </h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="form-group mb-4">
              <label className="block text-gray-700 font-medium mb-1">Email:</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="form-group mb-6">
              <label className="block text-gray-700 font-medium mb-1">Пароль:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Админ-панель</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Выйти
        </button>
      </header>
      <main className="container mx-auto p-6">
        {renderUsersSection}
        {renderProductsSection}
        {renderBranchesSection}
        {renderCategoriesSection}
        {renderPromoCodesSection}
        {renderDiscountsSection}
        {renderStoriesSection}
        {renderBannersSection}
      </main>
    </div>
  );
}

export default AdminPanel;