// ============ LOGIN GATE ============
// SECURITY NOTE (read this): this is a STATIC site with no server, so there is
// no way to do "real" server-side authentication here. What this gate does:
//   1. The password is never stored in plain text in the code — only its
//      SHA-256 hash is compared (see auth-config.js), so casually opening
//      this file doesn't reveal it.
//   2. Repeated wrong attempts get locked out for 60 seconds.
//   3. The session auto-expires after 30 minutes of inactivity.
// This deters casual snooping, but anyone with access to the browser's dev
// tools and localStorage can still bypass a client-only login. For real
// protection, put admin.html behind a server-side login, or at minimum
// password-protect the /admin folder at the hosting level (e.g. .htaccess
// Basic Auth on shared hosting, or your host's built-in password protection).
//
// ADMIN_EMAIL and ADMIN_PASSWORD_HASH come from auth-config.js (shared with
// the storefront login, so admins can log in either from index.html's
// "Login" button or directly on this page).

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const adminPasswordInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

function getAttemptState() {
    return JSON.parse(localStorage.getItem('libaas_admin_attempts') || '{"count":0,"lockedUntil":0}');
}
function setAttemptState(state) {
    localStorage.setItem('libaas_admin_attempts', JSON.stringify(state));
}

function isLockedOut() {
    const state = getAttemptState();
    return state.lockedUntil > Date.now();
}

function showLockoutMessage() {
    const state = getAttemptState();
    const secondsLeft = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    loginError.textContent = `Too many attempts. Try again in ${secondsLeft}s.`;
}

async function tryLogin() {
    if (isLockedOut()) {
        showLockoutMessage();
        return;
    }

    const enteredHash = await sha256(adminPasswordInput.value);

    if (enteredHash === ADMIN_PASSWORD_HASH) {
        setAttemptState({ count: 0, lockedUntil: 0 });
        sessionStorage.setItem('libaas_admin_session', 'true');
        sessionStorage.setItem('libaas_admin_last_active', Date.now().toString());
        loginScreen.style.display = 'none';
        adminApp.classList.add('show');
        loginError.textContent = '';
        renderGrid();
        renderOrders();
        renderChatList();
    } else {
        const state = getAttemptState();
        state.count += 1;
        if (state.count >= MAX_ATTEMPTS) {
            state.lockedUntil = Date.now() + LOCKOUT_MS;
            state.count = 0;
            setAttemptState(state);
            showLockoutMessage();
        } else {
            setAttemptState(state);
            loginError.textContent = `Incorrect password. ${MAX_ATTEMPTS - state.count} attempt(s) left.`;
        }
    }
    adminPasswordInput.value = '';
}

loginBtn.addEventListener('click', tryLogin);
adminPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryLogin();
});

function logout() {
    sessionStorage.removeItem('libaas_admin_session');
    sessionStorage.removeItem('libaas_admin_last_active');
    location.reload();
}
document.getElementById('logoutBtn').addEventListener('click', logout);

// Session inactivity check
function checkSessionExpiry() {
    const lastActive = parseInt(sessionStorage.getItem('libaas_admin_last_active') || '0', 10);
    if (lastActive && Date.now() - lastActive > SESSION_TIMEOUT_MS) {
        logout();
    }
}
['click', 'keydown', 'scroll'].forEach(evt => {
    document.addEventListener(evt, () => {
        if (sessionStorage.getItem('libaas_admin_session') === 'true') {
            sessionStorage.setItem('libaas_admin_last_active', Date.now().toString());
        }
    });
});
setInterval(checkSessionExpiry, 15000);

// Stay logged in for this browser tab session (until inactivity timeout)
if (sessionStorage.getItem('libaas_admin_session') === 'true') {
    checkSessionExpiry();
    if (sessionStorage.getItem('libaas_admin_session') === 'true') {
        loginScreen.style.display = 'none';
        adminApp.classList.add('show');
        renderGrid();
        renderOrders();
        renderChatList();
    }
}

// ============ TOAST ============
const adminToast = document.getElementById('adminToast');
let toastTimer;
function showToast(message) {
    adminToast.textContent = message;
    adminToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => adminToast.classList.remove('show'), 1800);
}

// ============ PRODUCT GRID ============
const productGrid = document.getElementById('productGrid');
let currentFilter = 'all';

const sectionLabels = {
    shopByCategory: 'Shop By Category',
    bestSellers: 'Bestsellers',
    trendingNow: 'Trending Now'
};

function renderGrid() {
    const products = getProducts();
    const filtered = currentFilter === 'all'
        ? products
        : products.filter(p => p.section === currentFilter);

    if (filtered.length === 0) {
        productGrid.innerHTML = '<p class="admin_empty">No products in this section yet. Add one to get started.</p>';
        return;
    }

    productGrid.innerHTML = filtered.map(p => {
        const name = p.type === 'bestseller' ? p.category : p.title;
        const meta = p.type === 'bestseller' ? (p.badge || 'Best Seller') : p.tagline;
        return `
            <div class="admin_card">
                <img class="admin_card_img" src="${p.image}" alt="${name}">
                <div class="admin_card_body">
                    <span class="admin_card_section">${sectionLabels[p.section] || p.section}</span>
                    <div class="admin_card_title">${name}</div>
                    <div class="admin_card_meta">${meta} · <span class="admin_card_price">Rs. ${p.price}</span></div>
                    <div class="admin_card_actions">
                        <button class="btn_edit" data-id="${p.id}">Edit</button>
                        <button class="btn_delete_card" data-id="${p.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

document.querySelectorAll('.filter_pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.filter_pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        renderGrid();
    });
});

productGrid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn_edit');
    const deleteBtn = e.target.closest('.btn_delete_card');

    if (editBtn) openEditForm(editBtn.dataset.id);
    if (deleteBtn) openDeleteConfirm(deleteBtn.dataset.id);
});

// ============ ADD / EDIT MODAL ============
const modalOverlay = document.getElementById('modalOverlay');
const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const productForm = document.getElementById('productForm');

const fieldId = document.getElementById('productId');
const fieldSection = document.getElementById('fieldSection');
const fieldCategory = document.getElementById('fieldCategory');
const fieldTitle = document.getElementById('fieldTitle');
const fieldTagline = document.getElementById('fieldTagline');
const fieldBadge = document.getElementById('fieldBadge');
const fieldPrice = document.getElementById('fieldPrice');
const fieldImage = document.getElementById('fieldImage');
const fieldImageUpload = document.getElementById('fieldImageUpload');
const imagePreview = document.getElementById('imagePreview');
const regularFields = document.getElementById('regularFields');
const bestsellerFields = document.getElementById('bestsellerFields');

function toggleFieldsBySection() {
    if (fieldSection.value === 'bestSellers') {
        regularFields.style.display = 'none';
        bestsellerFields.style.display = 'block';
    } else {
        regularFields.style.display = 'block';
        bestsellerFields.style.display = 'none';
    }
}
fieldSection.addEventListener('change', toggleFieldsBySection);

function openModal() {
    modalOverlay.classList.add('show');
    productModal.classList.add('show');
}
function closeModal() {
    modalOverlay.classList.remove('show');
    productModal.classList.remove('show');
    productForm.reset();
    imagePreview.classList.remove('show');
}

function openAddForm() {
    modalTitle.textContent = 'Add New Product';
    fieldId.value = '';
    productForm.reset();
    imagePreview.classList.remove('show');
    fieldSection.value = 'shopByCategory';
    toggleFieldsBySection();
    openModal();
}

function openEditForm(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;

    modalTitle.textContent = 'Edit Product';
    fieldId.value = product.id;
    fieldSection.value = product.section;
    fieldCategory.value = product.category;
    fieldPrice.value = product.price;
    fieldImage.value = product.image;

    if (product.type === 'bestseller') {
        fieldBadge.value = product.badge || 'Best Seller';
    } else {
        fieldTitle.value = product.title || '';
        fieldTagline.value = product.tagline || '';
    }

    toggleFieldsBySection();

    if (product.image) {
        imagePreview.src = product.image;
        imagePreview.classList.add('show');
    }

    openModal();
}

document.getElementById('openAddForm').addEventListener('click', openAddForm);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('cancelForm').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Image URL live preview
fieldImage.addEventListener('input', () => {
    if (fieldImage.value) {
        imagePreview.src = fieldImage.value;
        imagePreview.classList.add('show');
    } else {
        imagePreview.classList.remove('show');
    }
});

// Image file upload -> base64
fieldImageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        fieldImage.value = reader.result;
        imagePreview.src = reader.result;
        imagePreview.classList.add('show');
    };
    reader.readAsDataURL(file);
});

productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isBestseller = fieldSection.value === 'bestSellers';

    const data = {
        section: fieldSection.value,
        category: fieldCategory.value,
        type: isBestseller ? 'bestseller' : 'regular',
        price: parseInt(fieldPrice.value, 10) || 0,
        image: fieldImage.value || 'https://via.placeholder.com/400x500?text=LIBAAS'
    };

    if (isBestseller) {
        data.badge = fieldBadge.value || 'Best Seller';
    } else {
        data.title = fieldTitle.value || fieldCategory.value;
        data.tagline = fieldTagline.value || 'New Arrival';
    }

    if (fieldId.value) {
        updateProduct(fieldId.value, data);
        showToast('Product updated');
    } else {
        addProduct(data);
        showToast('Product added');
    }

    closeModal();
    renderGrid();
});

// ============ DELETE CONFIRM MODAL ============
const deleteOverlay = document.getElementById('deleteOverlay');
const deleteModal = document.getElementById('deleteModal');
let pendingDeleteId = null;

function openDeleteConfirm(id) {
    pendingDeleteId = id;
    deleteOverlay.classList.add('show');
    deleteModal.classList.add('show');
}
function closeDeleteConfirm() {
    pendingDeleteId = null;
    deleteOverlay.classList.remove('show');
    deleteModal.classList.remove('show');
}

document.getElementById('cancelDelete').addEventListener('click', closeDeleteConfirm);
deleteOverlay.addEventListener('click', closeDeleteConfirm);

document.getElementById('confirmDelete').addEventListener('click', () => {
    if (pendingDeleteId) {
        deleteProduct(pendingDeleteId);
        showToast('Product deleted');
        renderGrid();
    }
    closeDeleteConfirm();
});

// ============ TABS ============
document.querySelectorAll('.admin_tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin_tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin_tab_panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'orders') renderOrders();
        if (tab.dataset.tab === 'messages') renderChatList();
    });
});

// ============ ORDERS ============
const ordersList = document.getElementById('ordersList');
const pendingOrderBadge = document.getElementById('pendingOrderBadge');
let currentOrderFilter = 'all';

function updatePendingBadge() {
    const pendingCount = getOrders().filter(o => o.status === 'Pending').length;
    if (pendingCount > 0) {
        pendingOrderBadge.textContent = pendingCount;
        pendingOrderBadge.style.display = 'flex';
    } else {
        pendingOrderBadge.style.display = 'none';
    }
}

function renderOrders() {
    const orders = getOrders();
    const filtered = currentOrderFilter === 'all'
        ? orders
        : orders.filter(o => o.status === currentOrderFilter);

    updatePendingBadge();

    if (filtered.length === 0) {
        ordersList.innerHTML = '<p class="admin_empty">No orders here yet.</p>';
        return;
    }

    ordersList.innerHTML = filtered.map(o => {
        const date = new Date(o.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `
            <div class="order_row" data-id="${o.id}">
                <div class="order_row_left">
                    <span class="order_id">${o.id}</span>
                    <span class="order_customer">${o.customer.name} · ${o.customer.phone}</span>
                    <span class="order_meta">${o.items.length} item(s) · ${o.paymentMethod} · ${date}</span>
                </div>
                <div class="order_row_right">
                    <span class="order_total">Rs. ${o.subtotal}</span>
                    <span class="status_pill status_${o.status}">${o.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

document.querySelectorAll('[data-order-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('#tab-orders .filter_pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentOrderFilter = pill.dataset.orderFilter;
        renderOrders();
    });
});

ordersList.addEventListener('click', (e) => {
    const row = e.target.closest('.order_row');
    if (row) openOrderDetail(row.dataset.id);
});

// ============ ORDER DETAIL MODAL ============
const orderOverlay = document.getElementById('orderOverlay');
const orderModal = document.getElementById('orderModal');
const orderModalTitle = document.getElementById('orderModalTitle');
const orderModalBody = document.getElementById('orderModalBody');

function openOrderDetail(id) {
    const order = getOrders().find(o => o.id === id);
    if (!order) return;

    orderModalTitle.textContent = order.id;

    const itemsHTML = order.items.map(item => `
        <div class="order_detail_row">
            <span>${item.name} (x${item.qty})</span>
            <span>Rs. ${item.price * item.qty}</span>
        </div>
    `).join('');

    orderModalBody.innerHTML = `
        <div class="order_detail_section">
            <h4>Customer</h4>
            <div class="order_detail_row"><span>Name</span><span>${order.customer.name}</span></div>
            <div class="order_detail_row"><span>Phone</span><span>${order.customer.phone}</span></div>
            <div class="order_detail_row"><span>Address</span><span>${order.customer.address}</span></div>
            <div class="order_detail_row"><span>City</span><span>${order.customer.city}</span></div>
        </div>

        <div class="order_detail_section">
            <h4>Items</h4>
            ${itemsHTML}
            <div class="order_detail_row"><span><strong>Total</strong></span><span><strong>Rs. ${order.subtotal}</strong></span></div>
        </div>

        <div class="order_detail_section">
            <h4>Payment</h4>
            <div class="order_detail_row"><span>Method</span><span>${order.paymentMethod}</span></div>
            ${order.transactionId ? `<div class="order_detail_row"><span>Transaction ID</span><span>${order.transactionId}</span></div>` : ''}
        </div>

        <div class="order_detail_section">
            <h4>Status</h4>
            <select class="order_status_select" id="orderStatusSelect" data-id="${order.id}">
                <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        </div>

        <div class="modal_actions">
            <button type="button" class="btn_delete" id="deleteOrderBtn" data-id="${order.id}">Delete Order</button>
        </div>
    `;

    document.getElementById('orderStatusSelect').addEventListener('change', (e) => {
        updateOrderStatus(order.id, e.target.value);
        showToast('Order status updated');
        renderOrders();
    });

    document.getElementById('deleteOrderBtn').addEventListener('click', () => {
        deleteOrder(order.id);
        showToast('Order deleted');
        closeOrderDetail();
        renderOrders();
    });

    orderOverlay.classList.add('show');
    orderModal.classList.add('show');
}

function closeOrderDetail() {
    orderOverlay.classList.remove('show');
    orderModal.classList.remove('show');
}

document.getElementById('orderModalClose').addEventListener('click', closeOrderDetail);
orderOverlay.addEventListener('click', closeOrderDetail);

// Live update when a customer places a new order on the storefront (other tab)
window.addEventListener('storage', (e) => {
    if (e.key === 'libaas_orders') {
        renderOrders();
        if (getOrders().length && document.getElementById('tab-orders').classList.contains('active') === false) {
            showToast('New order received');
        }
    }
    if (e.key === 'libaas_products') {
        renderGrid();
    }
    if (e.key === 'libaas_chats') {
        renderChatList();
        updateMessageBadges();
        if (openChatId && document.getElementById('chatThreadModal').classList.contains('show')) {
            renderChatThread(openChatId, false);
        } else {
            showToast('New message received');
        }
    }
});

// ============ MESSAGES ============
const chatList = document.getElementById('chatList');
const messagesIconBtn = document.getElementById('messagesIconBtn');
const headerMsgBadge = document.getElementById('headerMsgBadge');
const pendingMsgBadge = document.getElementById('pendingMsgBadge');
const chatThreadOverlay = document.getElementById('chatThreadOverlay');
const chatThreadModal = document.getElementById('chatThreadModal');
const chatThreadTitle = document.getElementById('chatThreadTitle');
const chatThreadMessages = document.getElementById('chatThreadMessages');
const chatThreadForm = document.getElementById('chatThreadForm');
const chatThreadInput = document.getElementById('chatThreadInput');
let openChatId = null;

function updateMessageBadges() {
    const unreadCount = Object.values(getAllChats()).filter(c => c.unreadForAdmin).length;
    if (unreadCount > 0) {
        headerMsgBadge.classList.add('show');
        pendingMsgBadge.textContent = unreadCount;
        pendingMsgBadge.style.display = 'flex';
    } else {
        headerMsgBadge.classList.remove('show');
        pendingMsgBadge.style.display = 'none';
    }
}

function formatChatRowTime(iso) {
    return new Date(iso).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function renderChatList() {
    const chats = Object.values(getAllChats()).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    if (chats.length === 0) {
        chatList.innerHTML = '<p class="admin_empty">No conversations yet. Messages from the storefront chat widget will show up here.</p>';
        return;
    }

    chatList.innerHTML = chats.map(chat => {
        const lastMsg = chat.messages[chat.messages.length - 1];
        const preview = lastMsg ? (lastMsg.sender === 'admin' ? 'You: ' : '') + lastMsg.text : 'No messages yet';
        return `
            <div class="chat_row ${chat.unreadForAdmin ? 'unread' : ''}" data-id="${chat.id}">
                <div class="chat_row_left">
                    <span class="chat_row_name">
                        ${chat.unreadForAdmin ? '<span class="chat_row_dot"></span>' : ''}
                        ${chat.customerName}
                    </span>
                    <span class="chat_row_preview">${preview}</span>
                </div>
                <span class="chat_row_time">${formatChatRowTime(chat.lastMessageAt)}</span>
            </div>
        `;
    }).join('');

    updateMessageBadges();
}

chatList.addEventListener('click', (e) => {
    const row = e.target.closest('.chat_row');
    if (row) openChatThread(row.dataset.id);
});

messagesIconBtn.addEventListener('click', () => {
    document.querySelector('.admin_tab[data-tab="messages"]').click();
});

function renderChatThread(chatId, markRead = true) {
    const chat = getChat(chatId);
    if (!chat) return;

    chatThreadTitle.textContent = chat.customerName;

    if (chat.messages.length === 0) {
        chatThreadMessages.innerHTML = '<p class="admin_empty">No messages yet.</p>';
    } else {
        chatThreadMessages.innerHTML = chat.messages.map(m => `
            <div class="chat_thread_bubble ${m.sender}">
                ${m.text}
                <span class="chat_thread_bubble_time">${formatChatRowTime(m.timestamp)}</span>
            </div>
        `).join('');
        chatThreadMessages.scrollTop = chatThreadMessages.scrollHeight;
    }

    if (markRead) {
        markReadByAdmin(chatId);
        renderChatList();
    }
}

function openChatThread(chatId) {
    openChatId = chatId;
    renderChatThread(chatId, true);
    chatThreadOverlay.classList.add('show');
    chatThreadModal.classList.add('show');
}
function closeChatThread() {
    openChatId = null;
    chatThreadOverlay.classList.remove('show');
    chatThreadModal.classList.remove('show');
}

document.getElementById('chatThreadClose').addEventListener('click', closeChatThread);
chatThreadOverlay.addEventListener('click', closeChatThread);

chatThreadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatThreadInput.value.trim();
    if (!text || !openChatId) return;
    sendAdminMessage(openChatId, text);
    chatThreadInput.value = '';
    renderChatThread(openChatId, false);
    renderChatList();
});

// Initialize field visibility on load
toggleFieldsBySection();
updatePendingBadge();
renderChatList();
