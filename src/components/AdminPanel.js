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
  const [promoCodes, setPromoCodes] = useState({});
  const [userDiscounts, setUserDiscounts] = useState({});
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

  const formRef = useRef(null);
  const navigate = useNavigate();
  const baseURL = "https://nukesul-brepb-651f.twc1.net";

  const getImageUrl = (imageKey) => {
    if (!imageKey) return "https://via.placeholder.com/150?text=Image+Not+Found";
    const key = imageKey.split("/").pop();
    return `${baseURL}/product-image/${key}`;
  };

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
    if (newStoryImage) {
      formData.append("image", newStoryImage);
    }

    try {
      const url = isStoryEditMode
        ? `${baseURL}/stories/${editingStoryId}`
        : `${baseURL}/stories`;
      const method = isStoryEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при сохранении истории");
      }

      const updatedStory = await response.json();
      if (isStoryEditMode) {
        setStories(
          stories.map((story) =>
            story.id === editingStoryId ? updatedStory : story
          )
        );
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

  useEffect(() => {
    if (!selectedBranch || !isAuthenticated || !token) return;

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseURL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Ошибка загрузки продуктов");
        const data = await response.json();
        const branchProducts = data.filter(
          (p) => p.branch_id === selectedBranch
        );
        setProducts(Array.isArray(branchProducts) ? branchProducts : []);
      } catch (error) {
        console.error("Ошибка загрузки продуктов:", error);
        setError("Не удалось загрузить продукты");
      }
    };

    fetchProducts();
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
      setBranchFormData({
        name: branch.name,
        address: branch.address || "",
        phone: branch.phone || "",
      });
    } else {
      setBranchFormData({
        name: "",
        address: "",
        phone: "",
      });
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
      const url = currentBranch
        ? `${baseURL}/branches/${currentBranch.id}`
        : `${baseURL}/branches`;
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
      setCategoryFormData({
        name: category.name,
      });
    } else {
      setCategoryFormData({
        name: "",
      });
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
      const url = currentCategory
        ? `${baseURL}/categories/${currentCategory.id}`
        : `${baseURL}/categories`;
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
    if (!window.confirm("Вы уверены, что хотите удалить эту категорию?"))
      return;

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

  const handleAddPromoCode = async () => {
    if (!newPromoCode.code || !newPromoCode.discountPercent) {
      alert("Введите код и процент скидки!");
      return;
    }

    try {
      const response = await fetch(`${baseURL}/promo-codes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPromoCode),
      });
      if (!response.ok) throw new Error("Ошибка добавления промокода");
      const data = await response.json();
      setPromoCodeList([...promoCodeList, data]);
      setNewPromoCode({
        code: "",
        discountPercent: "",
        expiresAt: "",
        isActive: true,
      });
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
    if (!window.confirm("Вы уверены, что хотите удалить этот промокод?"))
      return;

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

    if (!name) {
      alert("Введите название продукта!");
      setIsSubmitting(false);
      return;
    }
    if (!categoryId) {
      alert("Выберите категорию!");
      setIsSubmitting(false);
      return;
    }

    // Проверяем, что хотя бы одна цена указана
    const hasAnyPrice =
      priceFieldsCount === 1
        ? priceSingle
        : priceSmall || priceMedium || priceLarge;
    if (!hasAnyPrice && !editMode) {
      alert("Укажите хотя бы одну цену!");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("branchId", selectedBranch);
    formData.append("categoryId", categoryId);
    formData.append("subCategoryId", subCategoryId || "");
    if (priceFieldsCount === 1) {
      formData.append("priceSingle", priceSingle || "");
      formData.append("priceSmall", "");
      formData.append("priceMedium", "");
      formData.append("priceLarge", "");
    } else {
      formData.append("priceSingle", "");
      formData.append("priceSmall", priceSmall || "");
      formData.append("priceMedium", priceMedium || "");
      formData.append("priceLarge", priceLarge || "");
    }
    if (image) formData.append("image", image);

    if (!image && !editMode) {
      alert("Загрузите изображение!");
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editMode
        ? `${baseURL}/products/${editingProductId}`
        : `${baseURL}/products`;
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
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProductId ? newProduct : p))
        );
        alert("Продукт обновлён!");
      } else {
        setProducts((prev) => [...prev, newProduct]);
        alert("Продукт добавлен!");
      }
      setImagePreview(getImageUrl(newProduct.image));
      resetFormFields();
      setEditMode(false);
      setEditingProductId(null);
    } catch (error) {
      console.error("Ошибка запроса:", error);
      alert(error.message || "Произошла ошибка при сохранении продукта");
    }

    setIsSubmitting(false);
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

  const handleDiscountChange = (userId, value) => {
    setUserDiscounts((prev) => ({ ...prev, [userId]: value }));
  };

  const handleSendPromoCode = async (userId) => {
    const discount = userDiscounts[userId];
    if (!discount || discount < 1 || discount > 100) {
      alert("Введите скидку от 1 до 100!");
      return;
    }

    try {
      const response = await fetch(`${baseURL}/users/${userId}/promo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discount: parseInt(discount, 10) }),
      });
      if (!response.ok) throw new Error("Ошибка отправки промокода");
      const data = await response.json();
      setPromoCodes((prev) => ({ ...prev, [userId]: data.promoCode }));
      setUserDiscounts((prev) => ({ ...prev, [userId]: "" }));
      alert(`Промокод отправлен: ${data.promoCode}`);
    } catch (error) {
      console.error("Ошибка промокода:", error);
      alert("Ошибка при отправке промокода");
    }
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
    setImagePreview(getImageUrl(product.image));

    let count = 0;
    if (product.price_small) count++;
    if (product.price_medium) count++;
    if (product.price_large) count++;
    setPriceFieldsCount(count || 1);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderUsersSection = () => {
    const filteredUsers = users.filter((user) =>
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="users-section">
        <h2>
          Пользователи{" "}
          <span className="user-count">({filteredUsers.length})</span>
        </h2>
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
                <button
                  onClick={() => handleDeleteUser(user.user_id)}
                  className="delete-btn"
                >
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
          <small>Укажите хотя бы одну цену</small>
        </div>
        {priceFieldsCount === 1 && (
          <div>
            <label>Цена (сом):</label>
            <input
              type="number"
              value={priceSingle}
              onChange={(e) => setPriceSingle(e.target.value)}
              min="0"
            />
          </div>
        )}
        {priceFieldsCount >= 1 && priceFieldsCount > 1 && (
          <div>
            <label>Маленький (сом):</label>
            <input
              type="number"
              value={priceSmall}
              onChange={(e) => setPriceSmall(e.target.value)}
              min="0"
            />
          </div>
        )}
        {priceFieldsCount >= 2 && (
          <div>
            <label>Средний (сом):</label>
            <input
              type="number"
              value={priceMedium}
              onChange={(e) => setPriceMedium(e.target.value)}
              min="0"
            />
          </div>
        )}
        {priceFieldsCount >= 3 && (
          <div>
            <label>Большой (сом):</label>
            <input
              type="number"
              value={priceLarge}
              onChange={(e) => setPriceLarge(e.target.value)}
              min="0"
            />
          </div>
        )}
      </>
    );
  };

  const renderBranchesSection = () => {
    return (
      <div>
        <div className="stories-section">
          <h2>Истории</h2>
          <form onSubmit={handleStorySubmit} className="story-form">
            <h3>
              {isStoryEditMode
                ? "Редактировать историю"
                : "Добавить новую историю"}
            </h3>
            <div>
              <label>Изображение:</label>
              {newStoryImagePreview && (
                <div className="image-preview-container">
                  <img
                    src={newStoryImagePreview}
                    alt="Превью"
                    className="image-preview"
                    style={{
                      maxWidth: "200px",
                      borderRadius: "8px",
                      margin: "10px 0",
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                onChange={handleStoryImageChange}
                accept="image/*"
                required={!isStoryEditMode}
              />
            </div>
            <button type="submit" className="submit-button">
              {isStoryEditMode ? "Обновить" : "Добавить"}
            </button>
            {isStoryEditMode && (
              <button
                type="button"
                onClick={resetStoryForm}
                className="cancel-button"
                style={{ marginLeft: "10px" }}
              >
                Отмена
              </button>
            )}
          </form>

          <div className="stories-list">
            <h3>Список историй</h3>
            {stories.length > 0 ? (
              <div className="story-cards">
                {stories.map((story) => (
                  <div key={story.id} className="story-card">
                    <img
                      src={story.image}
                      alt="История"
                      className="story-image"
                      style={{ maxWidth: "150px", borderRadius: "8px" }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/150?text=Image+Not+Found";
                      }}
                    />
                    <p>
                      Создано: {new Date(story.created_at).toLocaleString()}
                    </p>
                    <div className="story-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEditStory(story)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteStory(story.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Истории отсутствуют</p>
            )}
          </div>
        </div>
        <div className="branches-section">
          <h2>Филиалы</h2>
          <button className="add-button" onClick={() => openBranchModal()}>
            Добавить филиал
          </button>
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
                    <button
                      className="edit-button"
                      onClick={() => openBranchModal(branch)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="delete-button"
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
            <div className="modal">
              <div className="modal-content">
                <h3>
                  {currentBranch ? "Редактировать филиал" : "Добавить филиал"}
                </h3>
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
              < tr key={cat.id}>
                <td>{cat.name}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => openCategoryModal(cat)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="delete-button"
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
          <div className="modal">
            <div className="modal-content">
              <h3>
                {currentCategory
                  ? "Редактировать категорию"
                  : "Добавить категорию"}
              </h3>
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
        <div className="promo-code-form">
          <input
            type="text"
            placeholder="Код (например, SUMMER)"
            value={newPromoCode.code}
            onChange={(e) =>
              setNewPromoCode({ ...newPromoCode, code: e.target.value })
            }
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
          />
          <input
            type="datetime-local"
            value={newPromoCode.expiresAt}
            onChange={(e) =>
              setNewPromoCode({ ...newPromoCode, expiresAt: e.target.value })
            }
          />
          <label>
            Активен:
            <input
              type="checkbox"
              checked={newPromoCode.isActive}
              onChange={(e) =>
                setNewPromoCode({ ...newPromoCode, isActive: e.target.checked })
              }
            />
          </label>
          <button onClick={handleAddPromoCode}>Добавить промокод</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Скидка (%)</th>
              <th>Истекает</th>
              <th>Активен</th>
              <th>Создан</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {promoCodeList.map((promo) => (
              <tr key={promo.id}>
                <td>{promo.code}</td>
                <td>{promo.discount_percent}</td>
                <td>
                  {promo.expires_at
                    ? new Date(promo.expires_at).toLocaleString()
                    : "Нет"}
                </td>
                <td>{promo.is_active ? "Да" : "Нет"}</td>
                <td>{new Date(promo.created_at).toLocaleString()}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => handleEditPromoCode(promo)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="delete-button"
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
    );
  };

  const renderProductsByCategory = (categoryName) => {
    const filteredProducts = products.filter(
      (p) => p.category_name === categoryName
    );

    return (
      <div className="category-section">
        <h2>{categoryName}</h2>
        <div className="product-cards">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const hasMultipleSizes =
                product.price_small || product.price_medium || product.price_large;
              return (
                <div key={product.id} className="product-card">
                  {product.image ? (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/150?text=Image+Not+Found";
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="no-image">Изображение отсутствует</div>
                  )}
                  <h3>{product.name}</h3>
                  <p>{product.description || "Нет описания"}</p>
                  {product.effective_discount > 0 && (
                    <p className="discount">
                      Скидка: {product.effective_discount}%
                    </p>
                  )}
                  {hasMultipleSizes ? (
                    <div className="price-list">
                      {product.price_small && (
                        <p>
                          Маленький:{" "}
                          {product.effective_discount > 0 ? (
                            <>
                              <span className="old-price">
                                {product.price_small} сом
                              </span>{" "}
                              {product.final_price_small.toFixed(2)} сом
                            </>
                          ) : (
                            `${product.price_small} сом`
                          )}
                        </p>
                      )}
                      {product.price_medium && (
                        <p>
                          Средний:{" "}
                          {product.effective_discount > 0 ? (
                            <>
                              <span className="old-price">
                                {product.price_medium} сом
                              </span>{" "}
                              {product.final_price_medium.toFixed(2)} сом
                            </>
                          ) : (
                            `${product.price_medium} сом`
                          )}
                        </p>
                      )}
                      {product.price_large && (
                        <p>
                          Большой:{" "}
                          {product.effective_discount > 0 ? (
                            <>
                              <span className="old-price">
                                {product.price_large} сом
                              </span>{" "}
                              {product.final_price_large.toFixed(2)} сом
                            </>
                          ) : (
                            `${product.price_large} сом`
                          )}
                        </p>
                      )}
                    </div>
                  ) : product.price_single ? (
                    <p>
                      Цена:{" "}
                      {product.effective_discount > 0 ? (
                        <>
                          <span className="old-price">
                            {product.price_single} сом
                          </span>{" "}
                          {product.final_price_single.toFixed(2)} сом
                        </>
                      ) : (
                        `${product.price_single} сом`
                      )}
                    </p>
                  ) : (
                    <p>Цена не указана</p>
                  )}
                  <div className="product-buttons">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(product)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(product.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>Товаров в этой категории нет</p>
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <h1>Вход в админ-панель</h1>
        <form onSubmit={handleLogin}>
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
    <div className="admin-block">
      <h1>Админ-панель</h1>
      <button onClick={handleLogout} className="logout-button">
        Выйти
      </button>
      {error && <p className="error">{error}</p>}

      {renderBranchesSection()}
      {renderCategoriesSection()}
      {renderPromoCodesSection()}

      <form ref={formRef} onSubmit={handleSubmit} className="admin-form">
        <h2>{editMode ? "Редактировать продукт" : "Добавить новый продукт"}</h2>
        <div>
          <label>Филиал:</label>
          <select
            value={selectedBranch || ""}
            onChange={(e) => setSelectedBranch(Number(e.target.value))}
            required
          >
            <option value="">Выберите филиал</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Категория:</label>
          <select
            value={categoryId}
            onChange={handleCategoryChange}
            required={!editMode}
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {renderPriceFields()}

        <div>
          <label>Название:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={!editMode}
            placeholder="Введите название"
          />
        </div>

        <div>
          <label>Описание:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введите описание (необязательно)"
          />
        </div>

        <div>
          <label>Изображение:</label>
          {imagePreview && (
            <div className="image-preview-container">
              <img
                src={imagePreview}
                alt="Превью"
                className="image-preview"
                style={{
                  maxWidth: "200px",
                  borderRadius: "8px",
                  margin: "10px 0",
                }}
              />
            </div>
          )}
          <input type="file" onChange={handleImageChange} accept="image/*" />
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting
            ? editMode
              ? "Обновляем..."
              : "Добавляем..."
            : editMode
            ? "Обновить"
            : "Добавить"}
        </button>
      </form>

      {renderUsersSection()}

      <div className="products-section">
        {categories.map((cat) => renderProductsByCategory(cat.name))}
      </div>
    </div>
  );
}

export default AdminPanel;