/* ============================================================
   LIBAAS — Shared Orders Data Layer
   index.html writes new orders here when a customer checks out.
   admin.html reads/updates them (status, delete) from here.
   Same localStorage + storage-event pattern as products-data.js.
   ============================================================ */

const ORDERS_KEY = 'libaas_orders';

function getOrders() {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Corrupt order data.', e);
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('libaas-orders-updated', { detail: orders }));
}

function placeOrder(order) {
    const orders = getOrders();
    order.id = 'ORD-' + Date.now().toString().slice(-8);
    order.status = 'Pending';
    order.createdAt = new Date().toISOString();
    orders.unshift(order); // newest first
    saveOrders(orders);
    return order;
}

function updateOrderStatus(id, status) {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    orders[index].status = status;
    saveOrders(orders);
    return orders[index];
}

function deleteOrder(id) {
    const orders = getOrders().filter(o => o.id !== id);
    saveOrders(orders);
}
