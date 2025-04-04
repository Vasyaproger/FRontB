import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPanel.css";

function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [priceSmall, setPriceSmall] = useState("");
  const [priceMedium, setPriceMedium] = useState("");
  const [priceLarge, setPriceLarge] = useState("");
  const [priceSingle, setPriceSingle] = useState("");
  const [priceFieldsCount, setPriceFieldsCount] = useState(1);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [promoCodeList, setPromoCodeList] = useState([]);
  const [stories, setStories] = useState([]);
  const [newStoryImage, setNewStoryImage] = useState(null);
  const [newStoryImagePreview, setNewStoryImagePreview] = useState(null);
  const [isStoryEditMode, setIsStoryEditMode] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [newPromoCode, setNewPromoCode] = useState({
    code: "",
    discountPercent: "",
    expiresAt: "",
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]); // Добавлено для заказов
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false); // Модальное окно для заказов
  const [currentBranch, setCurrentBranch] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null); // Текущий заказ для редактирования
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

  const formRef = useRef(null);
  const navigate = useNavigate();
  const baseURL = "https://nukesul-brepb-651f.twc1.net";

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setIsAuthenticated(false);
        navigate("/admin-login");
        return;
      }
      try {
        const response = await fetch(`${baseURL}/products`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!response.ok) throw new Error("Токен недействителен");
        setIsAuthenticated(true);
        setToken(storedToken);
        await fetchInitialData(storedToken);
      } catch (err) {
        console.error("Ошибка проверки токена:", err);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        setToken("");
        setError("Токен недействителен. Войдите снова.");
        navigate("/admin-login");
      }
    };
    verifyToken();
  }, [navigate]);

  const fetchInitialData = async (authToken) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [
        branchesRes,
        categoriesRes,
        usersRes,
        promoCodesRes,
        storiesRes,
      ] = await Promise.all([
        fetch(`${baseURL}/branches`, { headers }),
        fetch(`${baseURL}/categories`, { headers }),
        fetch(`${baseURL}/users`, { headers }),
        fetch(`${baseURL}/promo-codes`, { headers }),
        fetch(`${baseURL}/stories`, { headers }),
      ]);

      const branchesData = await branchesRes.json();
      const categoriesData = await categoriesRes.json();
      const usersData = await usersRes.json();
      const promoCodesData = await promoCodesRes.json();
      const storiesData = await storiesRes.json();

      if (!branchesRes.ok) throw new Error("Ошибка загрузки филиалов");
      if (!categoriesRes.ok) throw new Error("Ошибка загрузки категорий");
      if (!usersRes.ok) throw new Error("Ошибка загрузки пользователей");
      if (!promoCodesRes.ok) throw new Error("Ошибка загрузки промокодов");
      if (!storiesRes.ok) throw new Error("Ошибка загрузки историй");

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setSelectedBranch(branchesData[0]?.id || null);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setUsers(
        Array.isArray(usersData)
          ? usersData.map((u) => ({
              user_id: u.id,
              first_name: u.name,
              email: u.email,
            }))
          : []
      );
      setPromoCodeList(Array.isArray(promoCodesData) ? promoCodesData : []);
      setStories(Array.isArray(storiesData) ? storiesData : []);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      setError(error.message || "Не удалось загрузить данные");
    }
  };

  const fetchProducts = async () => {
    if (!selectedBranch || !token) return;
    try {
      const response = await fetch(`${baseURL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка загрузки продуктов");
      const data = await response.json();
      const branchProducts = data.filter((p) => p.branch_id === selectedBranch);
      setProducts(Array.isArray(branchProducts) ? branchProducts : []);
    } catch (error) {
      console.error("Ошибка загрузки продуктов:", error);
      setError("Не удалось загрузить продукты");
    }
  };

  const fetchOrders = async () => {
    if (!selectedBranch || !token) return;
    try {
      const response = await fetch(`${baseURL}/api/public/branches/${selectedBranch}/orders`, {
        headers: { Authorization: `Bearer ${token}` }, // Защищаем маршрут для админов
      });
      if (!response.ok) throw new Error("Ошибка загрузки заказов");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
      setError("Не удалось загрузить заказы");
    }
  };

  useEffect(() => {
    if (selectedBranch && isAuthenticated && token) {
      fetchProducts();
      fetchOrders();
      const interval = setInterval(() => {
        fetchProducts();
        fetchOrders();
      }, 30000); // Обновление каждые 30 секунд
      return () => clearInterval(interval);
    }
  }, [selectedBranch, isAuthenticated, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseURL}/admin/login`, {
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
      console.error("Ошибка входа:", error);
      setError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setIsAuthenticated(false);
    navigate("/admin-login");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleStoryImageChange = (e) => {
    const file = e.target.files[0];
    setNewStoryImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewStoryImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setNewStoryImagePreview(null);
    }
  };

  const resetStoryForm = () => {
    setNewStoryImage(null);
    setNewStoryImagePreview(null);
    setIsStoryEditMode(false);
    setEditingStoryId(null);
  };

  const handleStorySubmit = async (e) => {
    e.preventDefault();
    if (!newStoryImage && !isStoryEditMode) {
      alert("Пожалуйста, выберите изображение!");
      return;
    }
    const formData = new FormData();
    if (newStoryImage) formData.append("image", newStoryImage);

    try {
      const url = isStoryEditMode ? `${baseURL}/stories/${editingStoryId}` : `${baseURL}/stories`;
      const method = isStoryEditMode ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при сохранении истории");
      }
      const updatedStory = await response.json();
      if (isStoryEditMode) {
        setStories(stories.map((story) => (story.id === editingStoryId ? updatedStory : story)));
        alert("История обновлена!");
      } else {
        setStories([...stories, updatedStory]);
        alert("История добавлена!");
      }
      resetStoryForm();
    } catch (error) {
      console.error("Ошибка при сохранении истории:", error);
      alert(error.message || "Произошла ошибка при сохранении истории");
    }
  };

  const handleEditStory = (story) => {
    setIsStoryEditMode(true);
    setEditingStoryId(story.id);
    setNewStoryImage(null);
    setNewStoryImagePreview(story.image);
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту историю?")) return;
    try {
      const response = await fetch(`${baseURL}/stories/${storyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления истории");
      setStories(stories.filter((s) => s.id !== storyId));
      alert("История удалена!");
    } catch (error) {
      console.error("Ошибка при удалении истории:", error);
      alert("Произошла ошибка при удалении истории");
    }
  };

  const handleCategoryChange = (e) => {
    setCategoryId(e.target.value);
    setSubCategoryId("");
    resetPriceFields();
    setPriceFieldsCount(1);
  };

  const resetFormFields = () => {
    setName("");
    setDescription("");
    setImage(null);
    setImagePreview(null);
    setCategoryId("");
    setSubCategoryId("");
    resetPriceFields();
    setPriceFieldsCount(1);
  };

  const resetPriceFields = () => {
    setPriceSmall("");
    setPriceMedium("");
    setPriceLarge("");
    setPriceSingle("");
  };

  const openBranchModal = (branch = null) => {
    setCurrentBranch(branch);
    if (branch) {
      setBranchFormData({ name: branch.name, address: branch.address || "", phone: branch.phone || "" });
    } else {
      setBranchFormData({ name: "", address: "", phone: "" });
    }
    setIsBranchModalOpen(true);
  };

  const closeBranchModal = () => {
    setIsBranchModalOpen(false);
    setCurrentBranch(null);
  };

  const handleBranchInputChange = (e) => {
    const { name, value } = e.target;
    setBranchFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveBranch = async () => {
    try {
      const method = currentBranch ? "PUT" : "POST";
      const url = currentBranch ? `${baseURL}/branches/${currentBranch.id}` : `${baseURL}/branches`;
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(branchFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка сохранения филиала");
      }
      const data = await response.json();
      if (currentBranch) {
        setBranches(branches.map((b) => (b.id === data.id ? data : b)));
      } else {
        setBranches([...branches, data]);
        if (!selectedBranch) setSelectedBranch(data.id);
      }
      closeBranchModal();
      alert("Филиал успешно сохранён!");
    } catch (error) {
      console.error("Ошибка:", error);
      alert(error.message || "Ошибка при сохранении филиала");
    }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот филиал?")) return;
    try {
      const response = await fetch(`${baseURL}/branches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления филиала");
      setBranches(branches.filter((b) => b.id !== id));
      if (selectedBranch === id) setSelectedBranch(branches[0]?.id || null);
      alert("Филиал успешно удалён!");
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка при удалении филиала");
    }
  };

  const openCategoryModal = (category = null) => {
    setCurrentCategory(category);
    if (category) {
      setCategoryFormData({ name: category.name });
    } else {
      setCategoryFormData({ name: "" });
    }
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCurrentCategory(null);
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveCategory = async () => {
    try {
      const method = currentCategory ? "PUT" : "POST";
      const url = currentCategory ? `${baseURL}/categories/${currentCategory.id}` : `${baseURL}/categories`;
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(categoryFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка сохранения категории");
      }
      const data = await response.json();
      if (currentCategory) {
        setCategories(categories.map((c) => (c.id === data.id ? data : c)));
      } else {
        setCategories([...categories, data]);
      }
      closeCategoryModal();
      alert("Категория успешно сохранена!");
    } catch (error) {
      console.error("Ошибка:", error);
      alert(error.message || "Ошибка при сохранении категории");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту категорию?")) return;
    try {
      const response = await fetch(`${baseURL}/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления категории");
      setCategories(categories.filter((c) => c.id !== id));
      alert("Категория успешно удалена!");
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка при удалении категории");
    }
  };

  const openOrderModal = (order = null) => {
    setCurrentOrder(order);
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setIsOrderModalOpen(false);
    setCurrentOrder(null);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${baseURL}/orders/${orderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Ошибка обновления статуса заказа");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
      alert("Статус заказа обновлен!");
      closeOrderModal();
    } catch (error) {
      console.error("Ошибка:", error);
      alert(error.message || "Ошибка при обновлении статуса заказа");
    }
  };

  const handleAddPromoCode = async () => {
    if (!newPromoCode.code || !newPromoCode.discountPercent) {
      alert("Введите код и процент скидки!");
      return;
    }
    try {
      const response = await fetch(`${baseURL}/promo-codes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newPromoCode),
      });
      if (!response.ok) throw new Error("Ошибка добавления промокода");
      const data = await response.json();
      setPromoCodeList([...promoCodeList, data]);
      setNewPromoCode({ code: "", discountPercent: "", expiresAt: "", isActive: true });
      alert("Промокод добавлен!");
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка при добавлении промокода");
    }
  };

  const handleEditPromoCode = (promo) => {
    setNewPromoCode({
      code: promo.code,
      discountPercent: promo.discount_percent,
      expiresAt: promo.expires_at ? promo.expires_at.slice(0, 16) : "",
      isActive: promo.is_active,
    });
    handleDeletePromoCode(promo.id);
  };

  const handleDeletePromoCode = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот промокод?")) return;
    try {
      const response = await fetch(`${baseURL}/promo-codes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления промокода");
      setPromoCodeList(promoCodeList.filter((p) => p.id !== id));
      alert("Промокод удалён!");
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка при удалении промокода");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот продукт?")) return;
    try {
      const response = await fetch(`${baseURL}/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления продукта");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      alert("Продукт успешно удалён!");
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      alert("Произошла ошибка при удалении продукта");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedBranch) {
      alert("Пожалуйста, выберите филиал!");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("branchId", selectedBranch);
    formData.append("categoryId", categoryId);
    formData.append("subCategoryId", subCategoryId || "");
    formData.append("priceSmall", priceSmall || "");
    formData.append("priceMedium", priceMedium || "");
    formData.append("priceLarge", priceLarge || "");
    formData.append("priceSingle", priceSingle || "");
    if (image) formData.append("image", image);

    if (!name || !categoryId || (!image && !editMode)) {
      alert("Заполните все обязательные поля (название, категория, изображение)!");
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editMode ? `${baseURL}/products/${editingProductId}` : `${baseURL}/products`;
      const method = editMode ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при сохранении продукта");
      }
      const newProduct = await response.json();
      if (editMode) {
        setProducts((prev) => prev.map((p) => (p.id === editingProductId ? newProduct : p)));
        alert("Продукт обновлён!");
      } else {
        setProducts((prev) => [...prev, newProduct]);
        alert("Продукт добавлен!");
      }
      resetFormFields();
      setEditMode(false);
      setEditingProductId(null);
    } catch (error) {
      console.error("Ошибка запроса:", error);
      alert(error.message || "Произошла ошибка при сохранении продукта");
    }
    setIsSubmitting(false);
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setCategoryId(product.category_id);
    setSubCategoryId(product.sub_category_id || "");
    setPriceSmall(product.price_small || "");
    setPriceMedium(product.price_medium || "");
    setPriceLarge(product.price_large || "");
    setPriceSingle(product.price_single || "");
    setImage(null);
    setImagePreview(product.image);
    let count = 0;
    if (product.price_small) count++;
    if (product.price_medium) count++;
    if (product.price_large) count++;
    setPriceFieldsCount(count || 1);
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const renderUsersSection = () => {
    const filteredUsers = users.filter((user) =>
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="users-section">
        <h2>Пользователи <span className="user-count">({filteredUsers.length})</span></h2>
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="user-cards">
          {filteredUsers.length > 0 ? (
            filteredUsers.slice(0, 10).map((user) => (
              <div key={user.user_id} className="user-card">
                <h3>{user.first_name}</h3>
                <p>Email: {user.email}</p>
                <button onClick={() => handleDeleteUser(user.user_id)} className="delete-btn">
                  Удалить
                </button>
              </div>
            ))
          ) : (
            <p>Пользователи не найдены</p>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить пользователя?")) return;
    try {
      const response = await fetch(`${baseURL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления пользователя");
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      alert("Пользователь удалён!");
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Произошла ошибка");
    }
  };

  const renderPriceFields = () => {
    if (!categoryId) return null;
    return (
      <>
        <div>
          <label>Количество размеров:</label>
          <select
            value={priceFieldsCount}
            onChange={(e) => {
              const count = parseInt(e.target.value);
              setPriceFieldsCount(count);
              if (count < 3) setPriceLarge("");
              if (count < 2) setPriceMedium("");
              if (count === 1) setPriceSingle(priceSmall || "");
            }}
          >
            <option value={1}>1 размер</option>
            <option value={2}>2 размера</option>
            <option value={3}>3 размера</option>
          </select>
        </div>
        {priceFieldsCount === 1 && (
          <div>
            <label>Цена (сом):</label>
            <input
              type="number"
              value={priceSingle}
              onChange={(e) => setPriceSingle(e.target.value)}
              min="0"
              placeholder="Введите цену"
            />
          </div>
        )}
        {priceFieldsCount >= 1 && priceFieldsCount > 1 && (
          <div>
            <label>Маленькая (сом):</label>
            <input
              type="number"
              value={priceSmall}
              onChange={(e) => setPriceSmall(e.target.value)}
              min="0"
              placeholder="Введите цену"
            />
          </div>
        )}
        {priceFieldsCount >= 2 && (
          <div>
            <label>Средняя (сом):</label>
            <input
              type="number"
              value={priceMedium}
              onChange={(e) => setPriceMedium(e.target.value)}
              min="0"
              placeholder="Введите цену"
            />
          </div>
        )}
        {priceFieldsCount >= 3 && (
          <div>
            <label>Большая (сом):</label>
            <input
              type="number"
              value={priceLarge}
              onChange={(e) => setPriceLarge(e.target.value)}
              min="0"
              placeholder="Введите цену"
            />
          </div>
        )}
      </>
    );
  };

  const renderBranchesSection = () => {
    return (
      <div className="branches-section">
        <h2>Филиалы</h2>
        <button className="add-button" onClick={() => openBranchModal()}>
          Добавить филиал
        </button>
        <select
          value={selectedBranch || ""}
          onChange={(e) => setSelectedBranch(Number(e.target.value))}
        >
          <option value="">Выберите филиал</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th>Телефон</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id}>
                <td>{branch.name}</td>
                <td>{branch.address || "Нет"}</td>
                <td>{branch.phone || "Нет"}</td>
                <td>
                  <button className="edit-button" onClick={() => openBranchModal(branch)}>
                    Редактировать
                  </button>
                  <button className="delete-button" onClick={() => deleteBranch(branch.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isBranchModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>{currentBranch ? "Редактировать филиал" : "Добавить филиал"}</h3>
              <div className="form-group">
                <label>Название:</label>
                <input
                  type="text"
                  name="name"
                  value={branchFormData.name}
                  onChange={handleBranchInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Адрес:</label>
                <input
                  type="text"
                  name="address"
                  value={branchFormData.address}
                  onChange={handleBranchInputChange}
                />
              </div>
              <div className="form-group">
                <label>Телефон:</label>
                <input
                  type="text"
                  name="phone"
                  value={branchFormData.phone}
                  onChange={handleBranchInputChange}
                />
              </div>
              <div className="modal-buttons">
                <button className="save-button" onClick={saveBranch}>
                  Сохранить
                </button>
                <button className="cancel-button" onClick={closeBranchModal}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrdersSection = () => {
    return (
      <div className="orders-section">
        <h2>Заказы</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Филиал</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{branches.find(b => b.id === order.branch_id)?.name || "Неизвестный"}</td>
                <td>{order.total} Сом</td>
                <td>{order.status === "pending" ? "Ожидает" :
                      order.status === "processing" ? "В обработке" :
                      order.status === "completed" ? "Завершен" : "Отменен"}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <button className="edit-button" onClick={() => openOrderModal(order)}>
                    Просмотр/Статус
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isOrderModalOpen && currentOrder && (
          <div className="modal">
            <div className="modal-content">
              <h3>Заказ #{currentOrder.id}</h3>
              <p><strong>Филиал:</strong> {branches.find(b => b.id === currentOrder.branch_id)?.name}</p>
              <p><strong>Сумма:</strong> {currentOrder.total} Сом</p>
              <p><strong>Статус:</strong> {currentOrder.status === "pending" ? "Ожидает" :
                                          currentOrder.status === "processing" ? "В обработке" :
                                          currentOrder.status === "completed" ? "Завершен" : "Отменен"}</p>
              <p><strong>Дата:</strong> {new Date(currentOrder.created_at).toLocaleString()}</p>
              <p><strong>Промокод:</strong> {currentOrder.promo_code || "Нет"}</p>
              <p><strong>Скидка:</strong> {currentOrder.discount}%</p>
              <h4>Детали заказа:</h4>
              <pre>{JSON.stringify(JSON.parse(currentOrder.order_details || "{}"), null, 2)}</pre>
              <h4>Детали доставки:</h4>
              <pre>{JSON.stringify(JSON.parse(currentOrder.delivery_details || "{}"), null, 2)}</pre>
              <h4>Товары:</h4>
              <ul>
                {JSON.parse(currentOrder.cart_items || "[]").map((item, index) => (
                  <li key={index}>{item.name} - {item.quantity} шт. ({item.discountedPrice} Сом)</li>
                ))}
              </ul>
              <div className="form-group">
                <label>Изменить статус:</label>
                <select
                  value={currentOrder.status}
                  onChange={(e) => updateOrderStatus(currentOrder.id, e.target.value)}
                >
                  <option value="pending">Ожидает</option>
                  <option value="processing">В обработке</option>
                  <option value="completed">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button className="cancel-button" onClick={closeOrderModal}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategoriesSection = () => {
    return (
      <div className="categories-section">
        <h2>Категории</h2>
        <button className="add-button" onClick={() => openCategoryModal()}>
          Добавить категорию
        </button>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>
                  <button className="edit-button" onClick={() => openCategoryModal(cat)}>
                    Редактировать
                  </button>
                  <button className="delete-button" onClick={() => deleteCategory(cat.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isCategoryModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>{currentCategory ? "Редактировать категорию" : "Добавить категорию"}</h3>
              <div className="form-group">
                <label>Название:</label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button className="save-button" onClick={saveCategory}>
                  Сохранить
                </button>
                <button className="cancel-button" onClick={closeCategoryModal}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPromoCodesSection = () => {
    return (
      <div className="promo-codes-section">
        <h2>Промокоды</h2>
        <div className="promo-form">
          <input
            type="text"
            placeholder="Код"
            value={newPromoCode.code}
            onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value })}
          />
          <input
            type="number"
            placeholder="Процент скидки"
            value={newPromoCode.discountPercent}
            onChange={(e) => setNewPromoCode({ ...newPromoCode, discountPercent: e.target.value })}
          />
          <input
            type="datetime-local"
            value={newPromoCode.expiresAt}
            onChange={(e) => setNewPromoCode({ ...newPromoCode, expiresAt: e.target.value })}
          />
          <label>
            Активен:
            <input
              type="checkbox"
              checked={newPromoCode.isActive}
              onChange={(e) => setNewPromoCode({ ...newPromoCode, isActive: e.target.checked })}
            />
          </label>
          <button onClick={handleAddPromoCode}>Добавить</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Скидка (%)</th>
              <th>Истекает</th>
              <th>Активен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {promoCodeList.map((promo) => (
              <tr key={promo.id}>
                <td>{promo.code}</td>
                <td>{promo.discount_percent}</td>
                <td>{promo.expires_at ? new Date(promo.expires_at).toLocaleString() : "Не истекает"}</td>
                <td>{promo.is_active ? "Да" : "Нет"}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEditPromoCode(promo)}>
                    Редактировать
                  </button>
                  <button className="delete-button" onClick={() => handleDeletePromoCode(promo.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStoriesSection = () => {
    return (
      <div className="stories-section">
        <h2>Истории</h2>
        <form onSubmit={handleStorySubmit} className="story-form">
          <div className="form-group">
            <label>Изображение:</label>
            <input type="file" accept="image/*" onChange={handleStoryImageChange} />
            {newStoryImagePreview && (
              <img src={newStoryImagePreview} alt="Preview" className="image-preview" />
            )}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isStoryEditMode ? "Обновить" : "Добавить"}
          </button>
          {isStoryEditMode && (
            <button type="button" onClick={resetStoryForm}>
              Отмена
            </button>
          )}
        </form>
        <div className="stories-list">
          {stories.map((story) => (
            <div key={story.id} className="story-item">
              <img src={story.image} alt="Story" className="story-image" />
              <div>
                <button className="edit-button" onClick={() => handleEditStory(story)}>
                  Редактировать
                </button>
                <button className="delete-button" onClick={() => handleDeleteStory(story.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProductsSection = () => {
    return (
      <div className="products-section">
        <h2>Продукты</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Изображение:</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            )}
          </div>
          <div className="form-group">
            <label>Категория:</label>
            <select value={categoryId} onChange={handleCategoryChange} required>
              <option value="">Выберите категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Подкатегория (опционально):</label>
            <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
              <option value="">Нет подкатегории</option>
              {categories
                .filter((cat) => cat.parent_id === parseInt(categoryId))
                .map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>
                    {subCat.name}
                  </option>
                ))}
            </select>
          </div>
          {renderPriceFields()}
          <button type="submit" disabled={isSubmitting}>
            {editMode ? "Обновить" : "Добавить"}
          </button>
          {editMode && (
            <button type="button" onClick={() => { setEditMode(false); resetFormFields(); }}>
              Отмена
            </button>
          )}
        </form>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Изображение</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цены</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <img src={product.image} alt={product.name} className="product-image" />
                </td>
                <td>{product.name}</td>
                <td>{categories.find((c) => c.id === product.category_id)?.name || "Нет"}</td>
                <td>
                  {product.price_small ? `Мал: ${product.price_small} ` : ""}
                  {product.price_medium ? `Сред: ${product.price_medium} ` : ""}
                  {product.price_large ? `Бол: ${product.price_large} ` : ""}
                  {product.price_single ? `${product.price_single} сом` : ""}
                </td>
                <td>
                  <button className="edit-button" onClick={() => handleEdit(product)}>
                    Редактировать
                  </button>
                  <button className="delete-button" onClick={() => handleDelete(product.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h2>Вход для администратора</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Панель администратора</h1>
        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </header>
      {error && <div className="error-message">{error}</div>}
      {renderBranchesSection()}
      {selectedBranch && (
        <>
          {renderCategoriesSection()}
          {renderProductsSection()}
          {renderOrdersSection()}
          {renderPromoCodesSection()}
          {renderStoriesSection()}
          {renderUsersSection()}
        </>
      )}
    </div>
  );
}

export default AdminPanel;