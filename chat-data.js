/* ============================================================
   LIBAAS — Shared Chat Data Layer
   index.html (chat widget) and admin.html (Messages tab) both
   read/write through this file via localStorage, same pattern
   as products-data.js / orders-data.js.
   ============================================================ */

const CHATS_KEY = 'libaas_chats';
const CHAT_ID_KEY = 'libaas_chat_id';

// Every visitor (logged in or not) gets a persistent chat thread id,
// stored on their browser so the conversation survives reloads.
function getChatId() {
    let id = localStorage.getItem(CHAT_ID_KEY);
    if (!id) {
        id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem(CHAT_ID_KEY, id);
    }
    return id;
}

function getAllChats() {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Corrupt chat data.', e);
        return {};
    }
}

function saveAllChats(chats) {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    window.dispatchEvent(new CustomEvent('libaas-chats-updated', { detail: chats }));
}

function getChat(chatId) {
    const chats = getAllChats();
    return chats[chatId] || null;
}

function ensureChat(chatId, customerName) {
    const chats = getAllChats();
    if (!chats[chatId]) {
        chats[chatId] = {
            id: chatId,
            customerName: customerName || 'Guest',
            messages: [],
            unreadForAdmin: false,
            unreadForCustomer: false,
            lastMessageAt: new Date().toISOString()
        };
        saveAllChats(chats);
    } else if (customerName && chats[chatId].customerName === 'Guest') {
        // upgrade a guest thread with the customer's real name once they log in
        chats[chatId].customerName = customerName;
        saveAllChats(chats);
    }
    return chats[chatId];
}

function sendCustomerMessage(chatId, text, customerName) {
    const chats = getAllChats();
    if (!chats[chatId]) {
        chats[chatId] = {
            id: chatId,
            customerName: customerName || 'Guest',
            messages: [],
            unreadForAdmin: false,
            unreadForCustomer: false,
            lastMessageAt: new Date().toISOString()
        };
    }
    chats[chatId].messages.push({ sender: 'customer', text, timestamp: new Date().toISOString() });
    chats[chatId].unreadForAdmin = true;
    chats[chatId].lastMessageAt = new Date().toISOString();
    if (customerName) chats[chatId].customerName = customerName;
    saveAllChats(chats);
}

function sendAdminMessage(chatId, text) {
    const chats = getAllChats();
    if (!chats[chatId]) return;
    chats[chatId].messages.push({ sender: 'admin', text, timestamp: new Date().toISOString() });
    chats[chatId].unreadForCustomer = true;
    chats[chatId].lastMessageAt = new Date().toISOString();
    saveAllChats(chats);
}

function markReadByAdmin(chatId) {
    const chats = getAllChats();
    if (!chats[chatId]) return;
    chats[chatId].unreadForAdmin = false;
    saveAllChats(chats);
}

function markReadByCustomer(chatId) {
    const chats = getAllChats();
    if (!chats[chatId]) return;
    chats[chatId].unreadForCustomer = false;
    saveAllChats(chats);
}

function anyUnreadForAdmin() {
    const chats = getAllChats();
    return Object.values(chats).some(c => c.unreadForAdmin);
}
