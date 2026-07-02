// ============ PRELOADER ============
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 4;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('done');
            }, 250);
        }
        progressBar.style.width = progress + '%';
        progressPercent.textContent = progress + '%';
    }, 120);
});

// ============ RENDER PRODUCTS FROM SHARED DATA LAYER ============
const shopByCategoryContainer = document.getElementById('shopByCategoryContainer');
const bestSellersContainer = document.getElementById('bestSellersContainer');
const trendingNowContainer = document.getElementById('trendingNowContainer');

function regularCardHTML(product) {
    return `
        <div class="card reveal active" data-category="${product.category}" data-id="${product.id}">
            <div class="card_text">
                <h3>${product.title}</h3>
                <h1>${product.tagline}</h1>
                <h2>FLATE Rs. ${product.price}</h2>
                <div class="card_actions">
                    <button>Shop Now</button>
                    <button class="add_cart_btn" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
            <div class="card_pic">
                <img src="${product.image}" alt="${product.title}">
            </div>
        </div>
    `;
}

function bestsellerCardHTML(product) {
    return `
        <div class="cat2_card color2 reveal active" data-category="${product.category}" data-id="${product.id}">
            <img src="${product.image}" alt="${product.category}">
            <div class="cat2_overlay">
                <p>${product.badge || 'Best Seller'}</p>
                <button class="add_cart_btn" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;
}

function renderProducts() {
    const products = getProducts();

    const shopByCategory = products.filter(p => p.section === 'shopByCategory');
    const bestSellers = products.filter(p => p.section === 'bestSellers');
    const trendingNow = products.filter(p => p.section === 'trendingNow');

    shopByCategoryContainer.innerHTML = shopByCategory.map(regularCardHTML).join('');
    bestSellersContainer.innerHTML = bestSellers.map(bestsellerCardHTML).join('');
    trendingNowContainer.innerHTML = trendingNow.map(regularCardHTML).join('');
}

renderProducts();

// ============ MOBILE NAV TOGGLE ============
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});

// ============ SCROLL REVEAL (static sections only — product cards render pre-visible) ============
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal:not(.active)').forEach(el => revealObserver.observe(el));

// ============ NAVBAR SHADOW + BACK TO TOP ON SCROLL ============
const navebar = document.getElementById('navebar');
const backTop = document.getElementById('backTop');
const scrollProgress = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        navebar.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4)';
    } else {
        navebar.style.boxShadow = '0 2px 14px rgba(0,0,0,0.25)';
    }

    if (window.scrollY > 500) {
        backTop.classList.add('show');
    } else {
        backTop.classList.remove('show');
    }

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgress.style.width = progress + '%';
});

backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============ CATEGORY DROPDOWN -> JUMP TO SECTION ============
function jumpToCategory(categoryName) {
    if (!categoryName) return;

    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    closeAllNavDropdowns();

    // scoped to actual product cards only — nav dropdown links carry the
    // same data-category attribute and would otherwise be matched first
    const target = document.querySelector(`.card[data-category="${categoryName}"], .cat2_card[data-category="${categoryName}"]`);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    target.classList.add('category-highlight');
    setTimeout(() => {
        target.classList.remove('category-highlight');
    }, 2800);
}

// ---- Attractive custom dropdowns (Men / Women) ----
const navDropdowns = document.querySelectorAll('.nav_dropdown');

function closeAllNavDropdowns() {
    navDropdowns.forEach(d => d.classList.remove('open'));
}

navDropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav_dropdown_toggle');
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        closeAllNavDropdowns();
        if (!isOpen) dropdown.classList.add('open');
    });

    dropdown.querySelectorAll('.nav_dropdown_menu a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            jumpToCategory(item.dataset.category);
        });
    });
});

document.addEventListener('click', () => closeAllNavDropdowns());

// ============ LIVE SEARCH ============
function jumpToProduct(id) {
    // scoped to actual product cards only — search result rows carry the
    // same data-id attribute and would otherwise be matched first
    const target = document.querySelector(`.card[data-id="${id}"], .cat2_card[data-id="${id}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('category-highlight');
    setTimeout(() => target.classList.remove('category-highlight'), 2800);
}

function searchProducts(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getProducts().filter(p => {
        const haystack = [
            p.title, p.tagline, p.category, p.badge
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
    }).slice(0, 8);
}

function renderSearchResults(query, resultsEl) {
    const results = searchProducts(query);

    if (!query.trim()) {
        resultsEl.classList.remove('show');
        resultsEl.innerHTML = '';
        return;
    }

    if (results.length === 0) {
        resultsEl.innerHTML = '<div class="search_empty">No products found for "' + query + '"</div>';
    } else {
        resultsEl.innerHTML = results.map(p => {
            const name = p.type === 'bestseller' ? `${p.category} — ${p.badge || 'Best Seller'}` : p.title;
            return `
                <div class="search_result_item" data-id="${p.id}">
                    <img src="${p.image}" alt="${name}">
                    <div class="search_result_info">
                        <strong>${name}</strong>
                        <span>Rs. ${p.price}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    resultsEl.classList.add('show');
}

function wireSearchInput(inputId, resultsId) {
    const input = document.getElementById(inputId);
    const resultsEl = document.getElementById(resultsId);
    if (!input || !resultsEl) return;

    input.addEventListener('input', () => renderSearchResults(input.value, resultsEl));

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchProducts(input.value);
            if (results.length > 0) {
                jumpToProduct(results[0].id);
                resultsEl.classList.remove('show');
                input.blur();
            }
        }
        if (e.key === 'Escape') {
            resultsEl.classList.remove('show');
            input.blur();
        }
    });

    resultsEl.addEventListener('click', (e) => {
        const item = e.target.closest('.search_result_item');
        if (!item) return;
        jumpToProduct(item.dataset.id);
        resultsEl.classList.remove('show');
        input.value = '';
    });

    input.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', () => resultsEl.classList.remove('show'));
}

wireSearchInput('searchInputDesktop', 'searchResultsDesktop');
wireSearchInput('searchInputMobile', 'searchResultsMobile');

// ============ CART (real add-to-cart, stored + persisted) ============
let cart = JSON.parse(localStorage.getItem('libaas_cart') || '[]');

const cartCountEl = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1800);
}

function saveCart() {
    localStorage.setItem('libaas_cart', JSON.stringify(cart));
}

function addToCart(product) {
    const existing = cart.find(item => item.name === product.name && item.price === product.price);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    renderCart();
    showToast('Added to cart');
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function renderCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = totalQty;

    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="cart_empty" id="cartEmpty">Your cart is empty. Start adding items you love.</p>';
        cartSubtotalEl.textContent = 'Rs. 0';
        return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.price * item.qty;

        const row = document.createElement('div');
        row.className = 'cart_item';
        row.innerHTML = `
            <div class="cart_item_info">
                <h4>${item.name}</h4>
                <span>Rs. ${item.price} x ${item.qty}</span>
                <div class="cart_item_qty">
                    <button class="cart_qty_btn" data-action="minus" data-index="${index}">-</button>
                    <span>${item.qty}</span>
                    <button class="cart_qty_btn" data-action="plus" data-index="${index}">+</button>
                    <button class="cart_remove" data-action="remove" data-index="${index}">Remove</button>
                </div>
            </div>
        `;
        cartItemsEl.appendChild(row);
    });

    cartSubtotalEl.textContent = `Rs. ${subtotal}`;
}

cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    const action = btn.dataset.action;

    if (action === 'plus') changeQty(index, 1);
    if (action === 'minus') changeQty(index, -1);
    if (action === 'remove') removeItem(index);
});

// Event delegation: works for cards that are (re)rendered dynamically from product data
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add_cart_btn');
    if (!btn) return;
    e.preventDefault();

    const id = btn.dataset.id;
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    const name = product.type === 'bestseller'
        ? `${product.category} — ${product.badge || 'Best Seller'}`
        : product.title;

    addToCart({ name, price: product.price });
});

// ============ CART DRAWER OPEN / CLOSE ============
function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('show');
}
function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('show');
}

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ============ CHECKOUT (order lands in the admin panel, not WhatsApp) ============
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutSummary = document.getElementById('checkoutSummary');
const paymentInstructions = document.getElementById('paymentInstructions');
const paymentInstructionsText = document.getElementById('paymentInstructionsText');
const custTxnId = document.getElementById('custTxnId');

const PAYMENT_ACCOUNTS = {
    JazzCash: 'Send payment to JazzCash 0300-1234567 (LIBAAS Store), then enter the transaction ID below.',
    Easypaisa: 'Send payment to Easypaisa 0300-1234567 (LIBAAS Store), then enter the transaction ID below.'
};

function updateCheckoutSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    checkoutSummary.innerHTML = `${cart.length} item(s) in cart<br><strong>Total: Rs. ${subtotal}</strong>`;
}

function openCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    closeCart();
    requireLogin(() => {
        updateCheckoutSummary();
        checkoutOverlay.classList.add('show');
        checkoutModal.classList.add('show');
    }, 'Please login to place your order.');
}
function closeCheckout() {
    checkoutOverlay.classList.remove('show');
    checkoutModal.classList.remove('show');
}

document.getElementById('cartCheckout').addEventListener('click', openCheckout);
document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
document.getElementById('cancelCheckout').addEventListener('click', closeCheckout);
checkoutOverlay.addEventListener('click', closeCheckout);

document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const method = document.querySelector('input[name="paymentMethod"]:checked').value;
        if (method === 'JazzCash' || method === 'Easypaisa') {
            paymentInstructionsText.textContent = PAYMENT_ACCOUNTS[method];
            paymentInstructions.style.display = 'block';
        } else {
            paymentInstructions.style.display = 'none';
        }
    });
});

checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if ((paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') && !custTxnId.value.trim()) {
        showToast('Please enter your transaction ID');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = {
        items: cart.map(item => ({ name: item.name, price: item.price, qty: item.qty })),
        subtotal,
        customer: {
            name: document.getElementById('custName').value.trim(),
            phone: document.getElementById('custPhone').value.trim(),
            address: document.getElementById('custAddress').value.trim(),
            city: document.getElementById('custCity').value.trim()
        },
        paymentMethod,
        transactionId: custTxnId.value.trim() || null
    };

    const savedOrder = placeOrder(order);

    // clear cart
    cart = [];
    saveCart();
    renderCart();

    checkoutForm.reset();
    paymentInstructions.style.display = 'none';
    closeCheckout();

    document.getElementById('confirmOrderId').textContent = savedOrder.id;
    document.getElementById('confirmOverlay').classList.add('show');
    document.getElementById('confirmModal').classList.add('show');
});

document.getElementById('closeConfirm').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('show');
    document.getElementById('confirmModal').classList.remove('show');
});
document.getElementById('confirmOverlay').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('show');
    document.getElementById('confirmModal').classList.remove('show');
});

// ============ ACCOUNT / AUTH (login shows the user's name; admin creds redirect to admin panel) ============
const accountBtn = document.getElementById('accountBtn');
const accountLabel = document.getElementById('accountLabel');
const accountDropdown = document.getElementById('accountDropdown');
const authOverlay = document.getElementById('authOverlay');
const authModal = document.getElementById('authModal');
const authModalTitle = document.getElementById('authModalTitle');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormError = document.getElementById('loginFormError');
const registerFormError = document.getElementById('registerFormError');
const authGateMessage = document.getElementById('authGateMessage');

const CUSTOMER_SESSION_KEY = 'libaas_customer_session';
let pendingLoginAction = null; // holds "what the visitor was trying to do" until they log in

function getCustomerSession() {
    try {
        return JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY) || 'null');
    } catch (e) {
        return null;
    }
}

function setCustomerSession(customer) {
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ id: customer.id, name: customer.name, email: customer.email }));
    updateAccountUI();
}

function clearCustomerSession() {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    updateAccountUI();
}

function updateAccountUI() {
    const session = getCustomerSession();
    if (session) {
        accountLabel.textContent = session.name.split(' ')[0];
    } else {
        accountLabel.textContent = 'Login';
    }
}

function openAuthModal(message) {
    authOverlay.classList.add('show');
    authModal.classList.add('show');
    authGateMessage.textContent = message || '';
    authGateMessage.style.display = message ? 'block' : 'none';
}
function closeAuthModal() {
    authOverlay.classList.remove('show');
    authModal.classList.remove('show');
    authGateMessage.style.display = 'none';
    loginForm.reset();
    registerForm.reset();
    loginFormError.textContent = '';
    registerFormError.textContent = '';
}

// Gate any action behind login: if already logged in, run it now.
// If not, remember it and prompt login/register first — it runs
// automatically right after a successful login or signup.
function requireLogin(action, message) {
    const session = getCustomerSession();
    if (session) {
        action();
    } else {
        pendingLoginAction = action;
        openAuthModal(message);
    }
}

accountBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const session = getCustomerSession();
    if (session) {
        accountDropdown.classList.toggle('show');
    } else {
        openAuthModal();
    }
});

document.addEventListener('click', () => {
    accountDropdown.classList.remove('show');
});

document.getElementById('logoutCustomerBtn').addEventListener('click', () => {
    clearCustomerSession();
    accountDropdown.classList.remove('show');
    showToast('Logged out');
});

document.getElementById('authClose').addEventListener('click', () => {
    pendingLoginAction = null;
    closeAuthModal();
});
authOverlay.addEventListener('click', () => {
    pendingLoginAction = null;
    closeAuthModal();
});

document.querySelectorAll('.auth_tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth_tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.authTab === 'login';
        authModalTitle.textContent = isLogin ? 'Login' : 'Create Account';
        loginForm.style.display = isLogin ? 'flex' : 'none';
        registerForm.style.display = isLogin ? 'none' : 'flex';
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginFormError.textContent = '';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Admin credentials -> straight to the admin panel, not a customer session
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const hash = await sha256(password);
        if (hash === ADMIN_PASSWORD_HASH) {
            window.location.href = 'admin.html';
            return;
        }
        loginFormError.textContent = 'Incorrect admin password.';
        return;
    }

    const customer = await verifyCustomerLogin(email, password);
    if (!customer) {
        loginFormError.textContent = 'Incorrect email or password.';
        return;
    }

    setCustomerSession(customer);
    closeAuthModal();
    showToast(`Welcome back, ${customer.name.split(' ')[0]}`);

    if (pendingLoginAction) {
        const action = pendingLoginAction;
        pendingLoginAction = null;
        action();
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerFormError.textContent = '';

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        registerFormError.textContent = 'This email is reserved. Please use a different one.';
        return;
    }

    try {
        const customer = await registerCustomer({ name, email, password });
        setCustomerSession(customer);
        closeAuthModal();
        showToast(`Welcome to LIBAAS, ${customer.name.split(' ')[0]}`);

        if (pendingLoginAction) {
            const action = pendingLoginAction;
            pendingLoginAction = null;
            action();
        }
    } catch (err) {
        registerFormError.textContent = err.message;
    }
});

updateAccountUI();

// ============ CHAT WIDGET ============
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const chatPanelClose = document.getElementById('chatPanelClose');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBadge = document.getElementById('chatBadge');

const myChatId = getChatId();

function getMyDisplayName() {
    const session = getCustomerSession();
    return session ? session.name : 'Guest';
}

function formatChatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

function renderChat() {
    const chat = getChat(myChatId);

    if (!chat || chat.messages.length === 0) {
        chatMessages.innerHTML = '<p class="chat_empty_state">Say hi 👋 — ask us anything about sizing, delivery, or your order.</p>';
    } else {
        chatMessages.innerHTML = chat.messages.map(m => `
            <div class="chat_bubble ${m.sender}">
                ${m.text}
                <span class="chat_bubble_time">${formatChatTime(m.timestamp)}</span>
            </div>
        `).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateChatBadge();
}

function updateChatBadge() {
    const chat = getChat(myChatId);
    if (chat && chat.unreadForCustomer) {
        chatBadge.classList.add('show');
    } else {
        chatBadge.classList.remove('show');
    }
}

function openChatPanel() {
    chatPanel.classList.add('open');
    markReadByCustomer(myChatId);
    updateChatBadge();
    renderChat();
}
function closeChatPanel() {
    chatPanel.classList.remove('open');
}

chatToggle.addEventListener('click', () => {
    if (chatPanel.classList.contains('open')) {
        closeChatPanel();
    } else {
        openChatPanel();
    }
});
chatPanelClose.addEventListener('click', closeChatPanel);

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    requireLogin(() => {
        sendCustomerMessage(myChatId, text, getMyDisplayName());
        chatInput.value = '';
        renderChat();
    }, 'Please login to start chatting with us.');
});

// Live update when admin replies (or sends first message) from another tab
window.addEventListener('storage', (e) => {
    if (e.key === 'libaas_chats') {
        updateChatBadge();
        if (chatPanel.classList.contains('open')) {
            markReadByCustomer(myChatId);
            renderChat();
        }
    }
});

updateChatBadge();

// ============ NEWSLETTER FORM ============
const newsletterForm = document.getElementById('newsletterForm');
newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Subscribed successfully');
    newsletterForm.reset();
});

// ============ FOOTER YEAR ============
document.getElementById('year').textContent = new Date().getFullYear();

// ============ LIVE SYNC WITH ADMIN PANEL ============
// Different tab / different window on the same browser -> native storage event
window.addEventListener('storage', (e) => {
    if (e.key === 'libaas_products') {
        renderProducts();
        showToast('Store updated');
    }
});
// Same tab (in case admin logic ever runs alongside this page) -> custom event
window.addEventListener('libaas-products-updated', () => {
    renderProducts();
});

// ============ INITIAL RENDER ============
renderCart();
