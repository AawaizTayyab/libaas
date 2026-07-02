/* ============================================================
   LIBAAS — Shared Product Data Layer
   Both index.html (storefront) and admin.html (admin panel)
   read/write through this file, using localStorage as the
   shared "API" between the two pages.

   - Same browser, different tabs  -> updates apply INSTANTLY
     (via the native 'storage' event).
   - Same tab                      -> updates apply instantly
     (via the custom 'libaas-products-updated' event).
   - Different device/browser      -> won't sync automatically,
     since there is no real server here. If you later want
     changes visible on every visitor's device, this data layer
     would need to be swapped for real backend/API calls
     (the function names below are written so that swap is easy).
   ============================================================ */

const PRODUCTS_KEY = 'libaas_products';

const DEFAULT_PRODUCTS = [
    // ---------- Shop By Category ----------
    { id: 'p1',  type: 'regular',    section: 'shopByCategory', category: 'Men Shirts',   title: 'Men Shirts',   tagline: 'Hot Selling Item',     price: 900,  image: 'pic1.png' },
    { id: 'p2',  type: 'regular',    section: 'shopByCategory', category: 'Men Jeans',    title: 'Men Jeans',    tagline: 'Hot Trending Item',    price: 1300, image: 'pic2.png' },
    { id: 'p3',  type: 'regular',    section: 'shopByCategory', category: 'Women Shirts', title: 'Women Shirts', tagline: 'Selling Item',         price: 1000, image: 'pic3.png' },
    { id: 'p4',  type: 'regular',    section: 'shopByCategory', category: 'Women Jeans',  title: 'Women Jeans',  tagline: 'Trending Item',        price: 1500, image: 'pic4.png' },
    { id: 'p5',  type: 'regular',    section: 'shopByCategory', category: 'Women Abaya',  title: 'Women Abaya',  tagline: 'Most Loved Item',      price: 1000, image: 'pic5.png' },

    // ---------- Bestsellers ----------
    { id: 'p6',  type: 'bestseller', section: 'bestSellers',    category: 'Women Abaya',  badge: 'Best Seller', price: 1800, image: 'pic6.png' },
    { id: 'p7',  type: 'bestseller', section: 'bestSellers',    category: 'Women Abaya',  badge: 'Best Seller', price: 1900, image: 'pic7.png' },
    { id: 'p8',  type: 'bestseller', section: 'bestSellers',    category: 'Women Abaya',  badge: 'Best Seller', price: 2000, image: 'pic8.png' },
    { id: 'p9',  type: 'bestseller', section: 'bestSellers',    category: 'Women Abaya',  badge: 'Best Seller', price: 2100, image: 'pic9.png' },

    // ---------- Trending Now ----------
    { id: 'p10', type: 'regular',    section: 'trendingNow',    category: 'Men Shirts',   title: 'MEN Shirts',   tagline: 'HOT Trending Item',    price: 1000, image: 'pic10.png' },
    { id: 'p11', type: 'regular',    section: 'trendingNow',    category: 'Men Shirts',   title: 'MEN Shirts',   tagline: 'HOT Trending Item',    price: 1500, image: 'pic11.png' },
    { id: 'p12', type: 'regular',    section: 'trendingNow',    category: 'Men Jeans',    title: 'MEN Jeans',    tagline: 'LOVED Item',           price: 1000, image: 'pic12.png' },
    { id: 'p13', type: 'regular',    section: 'trendingNow',    category: 'Men Jeans',    title: 'MEN Jeans',    tagline: 'LOVED Item',           price: 1500, image: 'pic13.png' },
    { id: 'p14', type: 'regular',    section: 'trendingNow',    category: 'Women Abaya',  title: 'Women Abaya',  tagline: 'MOSt LovedItem',       price: 1000, image: 'pic14.png' },
    { id: 'p15', type: 'regular',    section: 'trendingNow',    category: 'Women Abaya',  title: 'Women Abaya',  tagline: 'MOSt LOVED Item',      price: 1500, image: 'pic15.png' },
];

function getProducts() {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
        return [...DEFAULT_PRODUCTS];
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Corrupt product data, resetting to defaults.', e);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
        return [...DEFAULT_PRODUCTS];
    }
}

function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    // Notify listeners in THIS tab immediately (storage event only fires in OTHER tabs)
    window.dispatchEvent(new CustomEvent('libaas-products-updated', { detail: products }));
}

function addProduct(product) {
    const products = getProducts();
    product.id = 'p' + Date.now();
    products.push(product);
    saveProducts(products);
    return product;
}

function updateProduct(id, updatedFields) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updatedFields };
    saveProducts(products);
    return products[index];
}

function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
}

function resetProducts() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    saveProducts(getProducts());
}
