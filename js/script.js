
"use strict";

/* =========================================
   FAMCART - SHOP SMART TOGETHER
   Complete Vanilla JavaScript Application
   No external JSON or fetch required.
========================================= */

// STORAGE
const STORAGE_KEY = "famcart_v2_data";
const USERS_KEY = "famcart_v2_users";
const SESSION_KEY = "famcart_v2_session";

// CATEGORIES
const CATEGORIES = [
  { name: "Grocery", icon: "🛒" },
  { name: "Fruits", icon: "🍎" },
  { name: "Vegetables", icon: "🥬" },
  { name: "Meat", icon: "🥩" },
  { name: "Dairy", icon: "🥛" },
  { name: "Beverages", icon: "🧃" },
  { name: "Snacks", icon: "🍪" },
  { name: "Household", icon: "🧹" },
  { name: "Personal Care", icon: "🧴" }
];

// APPLICATION STATE
let data = null;
let currentUser = null;
let selectedListId = null;
let activeCategory = "All";
let authMode = "login";
let toastTimer = null;

// HELPERS
const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function newId() {
  data.nextId = (Number(data.nextId) || 1000) + 1;
  return data.nextId;
}

function formatDate(date = new Date()) {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function money(amount) {
  const symbols = {
    PHP: "₱",
    USD: "$",
    EUR: "€",
    JPY: "¥"
  };

  return (symbols[data?.currency] || "₱") +
    Number(amount || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
}

function allProducts() {
  return data.lists.flatMap(list =>
    list.items.map(item => ({
      ...item,
      listId: list.id,
      listName: list.name
    }))
  );
}

function findList(id) {
  return data.lists.find(list => Number(list.id) === Number(id));
}

function findProduct(id) {
  for (const list of data.lists) {
    const product = list.items.find(
      item => Number(item.id) === Number(id)
    );

    if (product) return { product, list };
  }

  return null;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Save error:", error);
    notify("Unable to save data. Check browser storage.");
    return false;
  }
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// SAMPLE DATA
function createSampleData() {
  return {
    familyName: "Mesa Family",
    currency: "PHP",
    nextId: 1000,

    lists: [
      {
        id: 1,
        name: "Weekly Groceries",
        items: [
          {
            id: 101,
            name: "Rice",
            category: "Grocery",
            quantity: 5,
            unit: "kg",
            price: 300,
            notes: "Regular rice",
            purchased: false
          },
          {
            id: 102,
            name: "Eggs",
            category: "Dairy",
            quantity: 1,
            unit: "pack",
            price: 120,
            notes: "Fresh eggs",
            purchased: false
          },
          {
            id: 103,
            name: "Milk",
            category: "Dairy",
            quantity: 2,
            unit: "bottle",
            price: 150,
            notes: "",
            purchased: true
          },
          {
            id: 104,
            name: "Apples",
            category: "Fruits",
            quantity: 6,
            unit: "pcs",
            price: 100,
            notes: "Fresh apples",
            purchased: false
          },
          {
            id: 105,
            name: "Chicken",
            category: "Meat",
            quantity: 2,
            unit: "kg",
            price: 280,
            notes: "",
            purchased: false
          },
          {
            id: 106,
            name: "Bread",
            category: "Grocery",
            quantity: 2,
            unit: "pack",
            price: 90,
            notes: "",
            purchased: false
          },
          {
            id: 107,
            name: "Bananas",
            category: "Fruits",
            quantity: 1,
            unit: "kg",
            price: 80,
            notes: "",
            purchased: false
          },
          {
            id: 108,
            name: "Tomatoes",
            category: "Vegetables",
            quantity: 1,
            unit: "kg",
            price: 75,
            notes: "",
            purchased: false
          }
        ]
      },
      {
        id: 2,
        name: "Household Essentials",
        items: [
          {
            id: 201,
            name: "Shampoo",
            category: "Personal Care",
            quantity: 1,
            unit: "bottle",
            price: 120,
            notes: "",
            purchased: false
          },
          {
            id: 202,
            name: "Bottled Water",
            category: "Beverages",
            quantity: 1,
            unit: "pack",
            price: 100,
            notes: "",
            purchased: false
          },
          {
            id: 203,
            name: "Dishwashing Liquid",
            category: "Household",
            quantity: 1,
            unit: "bottle",
            price: 85,
            notes: "",
            purchased: false
          },
          {
            id: 204,
            name: "Potato Chips",
            category: "Snacks",
            quantity: 2,
            unit: "pack",
            price: 50,
            notes: "",
            purchased: false
          }
        ]
      }
    ],

    familyMembers: [
      { id: 301, name: "Mark Mesa", role: "Admin" },
      { id: 302, name: "Family Member 1", role: "Member" },
      { id: 303, name: "Family Member 2", role: "Member" }
    ],

    history: [
      {
        id: 401,
        name: "Milk",
        category: "Dairy",
        quantity: 2,
        unit: "bottle",
        price: 150,
        listName: "Weekly Groceries",
        date: new Date().toISOString()
      }
    ]
  };
}

// INITIALIZE
function initApp() {
  try {
    startClock();
    const saved = localStorage.getItem(STORAGE_KEY);

    data = saved ? JSON.parse(saved) : createSampleData();

    if (!data || !Array.isArray(data.lists)) {
      data = createSampleData();
    }

    data.categories = CATEGORIES;
    data.lists = data.lists || [];
    data.familyMembers = data.familyMembers || [];
    data.history = data.history || [];
    data.currency = data.currency || "PHP";

    data.lists.forEach(list => {
      list.items = Array.isArray(list.items) ? list.items : [];
    });

    const ids = [
      ...data.lists.map(x => Number(x.id) || 0),
      ...data.familyMembers.map(x => Number(x.id) || 0),
      ...data.history.map(x => Number(x.id) || 0),
      ...allProducts().map(x => Number(x.id) || 0)
    ];

    data.nextId = Math.max(Number(data.nextId) || 1000, ...ids);

    if (!data.lists.length) {
      data.lists.push({
        id: newId(),
        name: "My Shopping List",
        items: []
      });
    }

    selectedListId = data.lists[0].id;

    if (!getUsers().length) {
      saveUsers([{
        name: "Mark Mesa",
        email: "family@famcart.com",
        password: "123456"
      }]);
    }

    bindEvents();
    saveData();

    const session = localStorage.getItem(SESSION_KEY);
    currentUser = getUsers().find(user => user.email === session) || null;

    if (currentUser) {
      showApp();
    } else {
      showAuth();
    }

  } catch (error) {
    console.error("Initialization error:", error);
    data = createSampleData();
    selectedListId = 1;
    saveData();
    showAuth();
    notify("Sample data restored.");
  }
}

// AUTHENTICATION
function showAuth() {
  $("authScreen").classList.remove("hidden");
  $("app").classList.add("hidden");
}

function showApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  updateProfileDisplay();
  renderAll();
  navigate("home");
}

function switchAuthMode() {
  authMode = authMode === "login" ? "register" : "login";

  $("authTitle").textContent =
    authMode === "login" ? "Welcome Back!" : "Create Your Account";

  $("authDescription").textContent =
    authMode === "login"
      ? "Login to manage your family shopping."
      : "Register to start organizing your shopping.";

  $("authSubmit").textContent =
    authMode === "login" ? "Login" : "Create Account";

  $("registerNameField").classList.toggle(
    "hidden",
    authMode === "login"
  );

  $("registerName").required = authMode === "register";

  $("authSwitchText").textContent =
    authMode === "login"
      ? "Don't have an account?"
      : "Already have an account?";

  $("authSwitch").textContent =
    authMode === "login" ? "Register" : "Login";
}

function handleAuth(event) {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;
  const users = getUsers();

  if (authMode === "login") {
    const user = users.find(
      item => item.email.toLowerCase() === email &&
        item.password === password
    );

    if (!user) {
      notify("Incorrect email or password.");
      return;
    }

    currentUser = user;
    localStorage.setItem(SESSION_KEY, user.email);
    $("authForm").reset();
    showApp();
    notify("Welcome back, " + user.name + "!");
  } else {
    const name = $("registerName").value.trim();

    if (name.length < 2) {
      notify("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      notify("Password must be at least 6 characters.");
      return;
    }

    if (users.some(user => user.email.toLowerCase() === email)) {
      notify("Email is already registered.");
      return;
    }

    currentUser = { name, email, password };
    users.push(currentUser);
    saveUsers(users);

    localStorage.setItem(SESSION_KEY, email);

    $("authForm").reset();
    data.familyMembers.push({
      id: newId(),
      name,
      role: "Admin"
    });

    saveData();
    showApp();
    notify("Account created successfully!");
  }
}

function logout() {
  if (!confirm("Are you sure you want to log out?")) return;

  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  closeAllModals();
  showAuth();
  notify("You have logged out.");
}

// PROFILE
function updateProfileDisplay() {
  if (!currentUser) return;

  const name = currentUser.name || "User";
  const initial = name.charAt(0).toUpperCase();

  $("topName").textContent = name;
  $("topAvatar").textContent = initial;
  $("sidebarFamily").textContent = data.familyName;
  $("settingsProfileName").value = name;
  $("settingsProfileEmail").value = currentUser.email;
  $("settingsFamilyName").value = data.familyName;
  $("currencySelect").value = data.currency;
}

function openProfileModal() {
  if (!currentUser) return;

  $("profileName").value = currentUser.name;
  $("profileEmail").value = currentUser.email;
  $("profilePassword").value = "";

  openModal("profileModal");
}

function updateProfile(event) {
  event.preventDefault();

  const name = $("profileName").value.trim();
  const email = $("profileEmail").value.trim().toLowerCase();
  const password = $("profilePassword").value;

  if (name.length < 2 || !email) {
    notify("Please complete the profile information.");
    return;
  }

  const users = getUsers();

  const duplicate = users.find(user =>
    user.email.toLowerCase() === email &&
    user.email.toLowerCase() !== currentUser.email.toLowerCase()
  );

  if (duplicate) {
    notify("That email is already in use.");
    return;
  }

  const oldEmail = currentUser.email;
  const user = users.find(item => item.email === oldEmail);

  if (!user) {
    notify("Account could not be found.");
    return;
  }

  user.name = name;
  user.email = email;

  if (password.trim()) {
    if (password.length < 6) {
      notify("Password must be at least 6 characters.");
      return;
    }
    user.password = password;
  }

  currentUser = user;
  saveUsers(users);

  localStorage.setItem(SESSION_KEY, email);

  updateProfileDisplay();
  renderFamily();
  closeModal("profileModal");
  notify("Profile updated successfully!");
}

function updateProfileFromSettings(event) {
  event.preventDefault();

  $("profileName").value = $("settingsProfileName").value;
  $("profileEmail").value = $("settingsProfileEmail").value;
  $("profilePassword").value = "";

  updateProfile(new Event("submit", {
    cancelable: true
  }));
}

// NAVIGATION
function navigate(page) {
  const titles = {
    home: ["Dashboard", "Your family shopping overview"],
    lists: ["My Lists", "Manage your shopping lists"],
    categories: ["Categories", "Browse your shopping products"],
    family: ["Family", "Manage your family members"],
    history: ["Shopping History", "View your completed purchases"],
    settings: ["Settings", "Manage your preferences"]
  };

  if (!titles[page]) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === "page-" + page
    );
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  $("pageTitle").textContent = titles[page][0];
  $("pageSubtitle").textContent = titles[page][1];

  $("sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "home") renderDashboard();
  if (page === "lists") renderLists();
  if (page === "categories") renderCategories();
  if (page === "family") renderFamily();
  if (page === "history") renderHistory();
  if (page === "settings") updateProfileDisplay();
}

/* LIVE DATE AND TIME */
function startClock() {
  function updateClock() {
    const now = new Date();

    const timeElement = document.getElementById("liveTime");
    const dateElement = document.getElementById("liveDate");

    if (timeElement) {
      timeElement.textContent = now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }

    if (dateElement) {
      dateElement.textContent = now.toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}


// DASHBOARD

function renderDashboard() {
  // Existing dashboard code mo rito
}

// DASHBOARD

function renderDashboard() {
  const products = allProducts();

  const total = products.length;
  const completedProducts = products.filter(p => p.purchased);
  const remainingProducts = products.filter(p => !p.purchased);

  const completed = completedProducts.length;
  const pending = remainingProducts.length;

  // Calculate total estimated prices using quantity
  const estimated = products.reduce(
    (sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0
  );

  const purchasedTotal = completedProducts.reduce(
    (sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0
  );

  const remainingTotal = remainingProducts.reduce(
    (sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0
  );

  const percent = total
    ? Math.round((completed / total) * 100)
    : 0;

  // Product statistics
  $("totalItems").textContent = total;
  $("completedItems").textContent = completed;
  $("remainingItems").textContent = pending;
  $("totalLists").textContent = data.lists.length;

  // Financial statistics
  $("totalEstimated").textContent = money(estimated);
  $("totalPurchased").textContent = money(purchasedTotal);
  $("totalRemainingCost").textContent = money(remainingTotal);

  // Progress
  $("completionPercent").textContent = percent + "%";
  $("completionBar").style.width = percent + "%";
  $("overviewPurchased").textContent = completed;
  $("overviewPending").textContent = pending;

  $("currentDate").textContent = formatDate();

  // Popular categories
  const popular = CATEGORIES.slice(0, 6);

  $("popularCategories").innerHTML = popular.map(category => {
    const count = products.filter(
      p => p.category === category.name
    ).length;

    return `
      <button class="popular-item"
        data-action="select-category"
        data-category="${escapeHTML(category.name)}">
        <span>${category.icon}</span>
        <strong>${escapeHTML(category.name)}</strong>
        <small>${count} items</small>
      </button>
    `;
  }).join("");

  // Recent activities
  const recent = [...data.history]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  $("recentActivity").innerHTML = recent.length
    ? recent.map(item => `
      <div class="history-row">
        <div>
          <strong>✓ ${escapeHTML(item.name)}</strong>
          <small>
            ${escapeHTML(item.category)} ·
            ${formatDate(item.date)}
          </small>
        </div>
        <strong class="history-price">
          ${money(Number(item.price) * Number(item.quantity))}
        </strong>
      </div>
    `).join("")
    : emptyState(
        "🛍️",
        "No recent activity",
        "Your purchases will appear here."
      );
}

// LISTS
function renderLists() {
  $("shoppingLists").innerHTML = data.lists.map(list => {
    const total = list.items.length;
    const done = list.items.filter(item => item.purchased).length;
    const percent = total ? Math.round(done / total * 100) : 0;

    return `
      <div class="list-card ${Number(selectedListId) === Number(list.id) ? "selected" : ""}"
        data-action="select-list" data-id="${list.id}">
        <div class="list-card-top">
          <div class="list-icon">🛒</div>
          <div class="product-actions">
            <button class="action-btn" data-action="edit-list"
              data-id="${list.id}" title="Edit">✎</button>
            <button class="action-btn delete" data-action="delete-list"
              data-id="${list.id}" title="Delete">×</button>
          </div>
        </div>
        <h3>${escapeHTML(list.name)}</h3>
        <p>${total} products · ${done} completed</p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <div class="list-card-bottom">
          <span>${percent}% completed</span>
          <span>View list →</span>
        </div>
      </div>
    `;
  }).join("");

  renderListProducts();
}

function selectList(id) {
  if (!findList(id)) return;

  selectedListId = Number(id);
  renderLists();
}

function renderListProducts() {
  const list = findList(selectedListId);

  if (!list) {
    $("selectedListTitle").textContent = "Shopping Items";
    $("listProducts").innerHTML = emptyState(
      "🛒", "No shopping list", "Create a list to start shopping."
    );
    return;
  }

  $("selectedListTitle").textContent = list.name;

  const search = $("listSearch").value.toLowerCase();
  const status = $("listStatus").value;

  const items = list.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search);
    const matchesStatus =
      status === "all" ||
      (status === "purchased" && item.purchased) ||
      (status === "pending" && !item.purchased);

    return matchesSearch && matchesStatus;
  });

  $("listProducts").innerHTML = items.length
    ? items.map(item => productHTML(item, list.id)).join("")
    : emptyState("🧺", "No products found", "Add a product to this shopping list.");
}

// CATEGORY PAGE
function renderCategories() {
  const products = allProducts();

  const categories = [
    { name: "All", icon: "🧺" },
    ...CATEGORIES
  ];

  $("categoryGrid").innerHTML = categories.map(category => {
    const count = category.name === "All"
      ? products.length
      : products.filter(p => p.category === category.name).length;

    return `
      <button class="category-card ${activeCategory === category.name ? "active" : ""}"
        data-action="select-category"
        data-category="${category.name}">
        <span class="cat-icon">${category.icon}</span>
        <strong>${category.name === "All" ? "All Categories" : escapeHTML(category.name)}</strong>
        <small>${count} products</small>
      </button>
    `;
  }).join("");

  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  $("categoryProductTitle").textContent =
    activeCategory === "All" ? "All Products" : activeCategory + " Products";

  $("categoryProducts").innerHTML = filtered.length
    ? filtered.map(item => productHTML(item, item.listId)).join("")
    : emptyState("🌱", "No products yet", "Add a product to this category to see it here.");
}

function selectCategory(category) {
  activeCategory = category;
  navigate("categories");
  renderCategories();
}

// PRODUCT DISPLAY
function productHTML(item, listId) {
  const category = CATEGORIES.find(c => c.name === item.category);
  const icon = category ? category.icon : "📦";

  return `
    <div class="product-row">
      <input type="checkbox" class="product-check"
        data-action="toggle-product" data-id="${item.id}"
        data-list="${listId}" ${item.purchased ? "checked" : ""}>
      <div class="product-info ${item.purchased ? "completed" : ""}">
        <strong>${icon} ${escapeHTML(item.name)}</strong>
        <small>
          ${escapeHTML(item.category)} ·
          ${escapeHTML(item.quantity)} ${escapeHTML(item.unit)}
          ${item.notes ? " · " + escapeHTML(item.notes) : ""}
        </small>
      </div>
      <strong class="product-price">${money(item.price)}</strong>
      <div class="product-actions">
        <button class="action-btn" data-action="edit-product"
          data-id="${item.id}" data-list="${listId}" title="Edit">✎</button>
        <button class="action-btn delete" data-action="delete-product"
          data-id="${item.id}" data-list="${listId}" title="Delete">×</button>
      </div>
    </div>
  `;
}

// ADD / EDIT PRODUCT
function fillProductSelects() {
  $("productCategory").innerHTML = CATEGORIES.map(category =>
    `<option value="${category.name}">${category.icon} ${category.name}</option>`
  ).join("");

  $("productList").innerHTML = data.lists.map(list =>
    `<option value="${list.id}">${escapeHTML(list.name)}</option>`
  ).join("");
}

function openProductModal(id = null, listId = null) {
  if (!data.lists.length) {
    notify("Create a shopping list first.");
    return;
  }

  $("productForm").reset();
  fillProductSelects();

  $("productId").value = "";
  $("productModalTitle").textContent = id ? "Edit Product" : "Add New Product";
  $("productQuantity").value = 1;

  const targetList = listId || selectedListId || data.lists[0].id;
  $("productList").value = String(targetList);

  if (id !== null) {
    const found = findProduct(id);
    if (!found) return;

    const item = found.product;

    $("productId").value = item.id;
    $("productName").value = item.name;
    $("productCategory").value = item.category;
    $("productList").value = String(found.list.id);
    $("productQuantity").value = item.quantity;
    $("productUnit").value = item.unit;
    $("productPrice").value = item.price;
    $("productNotes").value = item.notes || "";
  }

  openModal("productModal");
}

function saveProduct(event) {
  event.preventDefault();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const listId = Number($("productList").value);
  const quantity = Number($("productQuantity").value);
  const price = Number($("productPrice").value);
  const unit = $("productUnit").value;
  const notes = $("productNotes").value.trim();

  if (!name || name.length > 100) {
    notify("Enter a valid product name (maximum 100 characters).");
    return;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    notify("Quantity must be greater than zero.");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    notify("Price cannot be negative.");
    return;
  }

  const list = findList(listId);
  if (!list) {
    notify("Please select a valid shopping list.");
    return;
  }

  if (id) {
    const found = findProduct(id);
    if (!found) return;

    if (found.list.id !== listId) {
      found.list.items = found.list.items.filter(
        item => Number(item.id) !== Number(id)
      );

      list.items.push({
        ...found.product,
        name, category, quantity, unit, price, notes
      });
    } else {
      Object.assign(found.product, {
        name, category, quantity, unit, price, notes
      });
    }

    notify("Product updated successfully!");
  } else {
    list.items.push({
      id: newId(),
      name,
      category,
      quantity,
      unit,
      price,
      notes,
      purchased: false
    });

    notify("Product added successfully!");
  }

  selectedListId = listId;
  saveData();
  closeModal("productModal");
  renderAll();
}

// PURCHASE PRODUCT
function toggleProduct(id, listId) {
  const list = findList(listId);
  if (!list) return;

  const product = list.items.find(
    item => Number(item.id) === Number(id)
  );

  if (!product) return;

  product.purchased = !product.purchased;

  if (product.purchased) {
    data.history.push({
      id: newId(),
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit,
      price: product.price,
      listName: list.name,
      date: new Date().toISOString(),
      productId: product.id
    });

    notify(product.name + " marked as purchased!");
  } else {
    notify(product.name + " marked as not purchased.");
  }

  saveData();
  renderAll();
}

// DELETE PRODUCT
function deleteProduct(id, listId) {
  const list = findList(listId);
  if (!list) return;

  const product = list.items.find(
    item => Number(item.id) === Number(id)
  );

  if (!product) return;

  if (!confirm(`Delete "${product.name}" from this list?`)) return;

  list.items = list.items.filter(
    item => Number(item.id) !== Number(id)
  );

  saveData();
  renderAll();
  notify("Product deleted.");
}

// LIST MANAGEMENT
function openListModal(id = null) {
  $("listForm").reset();
  $("listId").value = "";
  $("listModalTitle").textContent = id ? "Edit Shopping List" : "Create Shopping List";

  if (id) {
    const list = findList(id);
    if (!list) return;
    $("listId").value = list.id;
    $("listName").value = list.name;
  }

  openModal("listModal");
}

function saveList(event) {
  event.preventDefault();

  const id = $("listId").value;
  const name = $("listName").value.trim();

  if (!name) {
    notify("Please enter a shopping list name.");
    return;
  }

  if (data.lists.some(list =>
    list.name.toLowerCase() === name.toLowerCase() &&
    Number(list.id) !== Number(id)
  )) {
    notify("A shopping list with this name already exists.");
    return;
  }

  if (id) {
    const list = findList(id);
    if (list) {
      list.name = name;
      notify("Shopping list updated.");
    }
  } else {
    const list = {
      id: newId(),
      name,
      items: []
    };

    data.lists.push(list);
    selectedListId = list.id;
    notify("New shopping list created!");
  }

  saveData();
  closeModal("listModal");
  renderAll();
}

function deleteList(id) {
  const list = findList(id);
  if (!list) return;

  if (!confirm(`Delete "${list.name}" and all its products?`)) return;

  data.lists = data.lists.filter(
    item => Number(item.id) !== Number(id)
  );

  if (!data.lists.length) {
    data.lists.push({
      id: newId(),
      name: "My Shopping List",
      items: []
    });
  }

  if (Number(selectedListId) === Number(id)) {
    selectedListId = data.lists[0].id;
  }

  saveData();
  renderAll();
  notify("Shopping list deleted.");
}

// FAMILY
function renderFamily() {
  $("familyPageName").textContent = data.familyName;
  $("familyMemberCount").textContent =
    data.familyMembers.length + " family members";

  $("sidebarFamily").textContent = data.familyName;

  $("familyGrid").innerHTML = data.familyMembers.length
    ? data.familyMembers.map(member => `
      <div class="member-card">
        <div class="member-avatar">
          ${escapeHTML(member.name.charAt(0).toUpperCase())}
        </div>
        <h3>${escapeHTML(member.name)}</h3>
        <p>${escapeHTML(member.role)}</p>
        <div class="member-actions">
          <button class="btn btn-outline btn-small"
            data-action="edit-member" data-id="${member.id}">✎ Edit</button>
          <button class="btn btn-danger-outline btn-small"
            data-action="delete-member" data-id="${member.id}">Remove</button>
        </div>
      </div>
    `).join("")
    : emptyState("👨‍👩‍👧", "No family members", "Add your family members.");
}

function openMemberModal(id = null) {
  $("memberForm").reset();
  $("memberId").value = "";
  $("memberModalTitle").textContent = id ? "Edit Family Member" : "Add Family Member";

  if (id) {
    const member = data.familyMembers.find(
      item => Number(item.id) === Number(id)
    );

    if (!member) return;

    $("memberId").value = member.id;
    $("memberName").value = member.name;
    $("memberRole").value = member.role;
  }

  openModal("memberModal");
}

function saveMember(event) {
  event.preventDefault();

  const id = $("memberId").value;
  const name = $("memberName").value.trim();
  const role = $("memberRole").value;

  if (name.length < 2) {
    notify("Enter a valid member name.");
    return;
  }

  if (id) {
    const member = data.familyMembers.find(
      item => Number(item.id) === Number(id)
    );

    if (member) {
      member.name = name;
      member.role = role;
    }

    notify("Family member updated.");
  } else {
    data.familyMembers.push({
      id: newId(),
      name,
      role
    });

    notify("Family member added!");
  }

  saveData();
  closeModal("memberModal");
  renderAll();
}

function deleteMember(id) {
  const member = data.familyMembers.find(
    item => Number(item.id) === Number(id)
  );

  if (!member) return;

  if (!confirm(`Remove ${member.name} from your family?`)) return;

  data.familyMembers = data.familyMembers.filter(
    item => Number(item.id) !== Number(id)
  );

  saveData();
  renderFamily();
  notify("Family member removed.");
}

// FAMILY NAME
function openFamilyModal() {
  $("familyNameInput").value = data.familyName;
  openModal("familyModal");
}

function saveFamilyName(event) {
  event.preventDefault();

  const name = $("familyNameInput").value.trim();

  if (!name) {
    notify("Enter a family name.");
    return;
  }

  data.familyName = name;

  saveData();
  updateProfileDisplay();
  renderFamily();

  closeModal("familyModal");
  notify("Family name updated!");
}

// HISTORY
function renderHistory() {
  const filter = $("historyCategory").value || "all";

  $("historyCategory").innerHTML =
    `<option value="all">All Categories</option>` +
    CATEGORIES.map(category =>
      `<option value="${category.name}">${category.name}</option>`
    ).join("");

  $("historyCategory").value = filter;

  const items = [...data.history]
    .filter(item => filter === "all" || item.category === filter)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

 const spending = data.history.reduce(
  (sum, item) =>
    sum + Number(item.price || 0) * Number(item.quantity || 0),
  0
);

  $("historyCount").textContent = data.history.length;
  $("historySpending").textContent = money(spending);

  $("historyList").innerHTML = items.length
    ? items.map(item => `
      <div class="history-row">
        <div>
          <strong>✓ ${escapeHTML(item.name)}</strong>
          <small>
            ${escapeHTML(item.category)} ·
            ${escapeHTML(item.quantity)} ${escapeHTML(item.unit)} ·
            ${escapeHTML(item.listName)}
          </small>
          <small>Purchased: ${formatDate(item.date)}</small>
        </div>
        <strong class="history-price">${money(item.price)}</strong>
      </div>
    `).join("")
    : emptyState("◷", "No purchase history", "Purchased products will appear here.");
}

function clearHistory() {
  if (!data.history.length) {
    notify("Your history is already empty.");
    return;
  }

  if (!confirm("Are you sure you want to clear all shopping history?")) return;

  data.history = [];
  saveData();
  renderAll();
  notify("Shopping history cleared.");
}

// SETTINGS
function saveFamilySettings(event) {
  event.preventDefault();

  const name = $("settingsFamilyName").value.trim();

  if (!name) {
    notify("Enter a family name.");
    return;
  }

  data.familyName = name;
  saveData();
  updateProfileDisplay();
  renderFamily();

  notify("Family settings saved!");
}

function saveCurrency() {
  data.currency = $("currencySelect").value;
  saveData();
  renderAll();
  notify("Currency updated successfully!");
}

function clearShoppingData() {
  if (!confirm("This will remove all lists, products, and shopping history. Continue?")) {
    return;
  }

  data.lists = [{
    id: newId(),
    name: "My Shopping List",
    items: []
  }];

  data.history = [];
  selectedListId = data.lists[0].id;

  saveData();
  renderAll();
  notify("Shopping data cleared.");
}

function resetSampleData() {
  if (!confirm("Restore original sample products and family information? Your current shopping data will be replaced.")) {
    return;
  }

  data = createSampleData();
  selectedListId = data.lists[0].id;
  activeCategory = "All";

  saveData();
  renderAll();
  notify("Sample data restored!");
}

// MODALS
function openModal(id) {
  $(id).classList.add("open");
}

function closeModal(id) {
  $(id).classList.remove("open");
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.classList.remove("open");
  });
}

// EMPTY STATE
function emptyState(icon, title, message) {
  return `
    <div class="empty-state">
      <span>${icon}</span>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

// NOTIFICATION
function notify(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// RENDER EVERYTHING
function renderAll() {
  if (!data) return;

  renderDashboard();
  renderLists();
  renderCategories();
  renderFamily();
  renderHistory();
  updateProfileDisplay();
}

// EVENT LISTENERS
function bindEvents() {
  // Authentication
  $("authForm").addEventListener("submit", handleAuth);
  $("authSwitch").addEventListener("click", switchAuthMode);

  // Navigation
  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.page));
  });

  // General button actions using event delegation
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const listId = button.dataset.list;

    switch (action) {
      case "add-product":
        openProductModal();
        break;

      case "edit-product":
        openProductModal(id, listId);
        break;

      case "delete-product":
        deleteProduct(id, listId);
        break;

      case "toggle-product":
        // Handled by the change listener below.
        break;

      case "add-list":
        openListModal();
        break;

      case "edit-list":
        openListModal(id);
        break;

      case "delete-list":
        deleteList(id);
        break;

      case "select-list":
        selectList(id);
        break;

      case "select-category":
        selectCategory(button.dataset.category);
        break;

      case "add-member":
        openMemberModal();
        break;

      case "edit-member":
        openMemberModal(id);
        break;

      case "delete-member":
        deleteMember(id);
        break;

      case "edit-family":
        openFamilyModal();
        break;

      case "clear-history":
        clearHistory();
        break;

      case "clear-data":
        clearShoppingData();
        break;

      case "reset-data":
        resetSampleData();
        break;
    }
  });

  // Product checkbox changes
  document.addEventListener("change", event => {
    if (event.target.matches('[data-action="toggle-product"]')) {
      toggleProduct(
        event.target.dataset.id,
        event.target.dataset.list
      );
    }
  });

  // Add / Edit forms
  $("productForm").addEventListener("submit", saveProduct);
  $("listForm").addEventListener("submit", saveList);
  $("memberForm").addEventListener("submit", saveMember);
  $("familyForm").addEventListener("submit", saveFamilyName);
  $("profileForm").addEventListener("submit", updateProfile);
  $("familySettingsForm").addEventListener("submit", saveFamilySettings);
  $("profileSettingsForm").addEventListener("submit", updateProfileFromSettings);

  // Profile and logout
  $("profileQuickBtn").addEventListener("click", openProfileModal);
  $("logoutBtn").addEventListener("click", logout);

  // Mobile sidebar
  $("menuToggle").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });

  // List filters
  $("listSearch").addEventListener("input", renderListProducts);
  $("listStatus").addEventListener("change", renderListProducts);

  // History filter
  $("historyCategory").addEventListener("change", renderHistory);

  // Currency
  $("saveCurrency").addEventListener("click", saveCurrency);

  // Close modal buttons
  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.close);
    });
  });

  // Close modal by clicking outside
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        modal.classList.remove("open");
      }
    });
  });

  // Escape key
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAllModals();
      $("sidebar").classList.remove("open");
    }
  });

  // Quick navigation buttons
  document.querySelectorAll("[data-page]").forEach(button => {
    if (button.classList.contains("nav-item")) return;

    button.addEventListener("click", () => {
      navigate(button.dataset.page);
    });
  });
}

// START APPLICATION
document.addEventListener("DOMContentLoaded", initApp);
