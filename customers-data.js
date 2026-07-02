/* ============================================================
   LIBAAS — Shared Customer Accounts Data Layer
   Requires auth-config.js to be loaded first (for sha256()).
   Passwords are stored as SHA-256 hashes, never plain text.
   ============================================================ */

const CUSTOMERS_KEY = 'libaas_customers';

function getCustomers() {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Corrupt customer data.', e);
        return [];
    }
}

function saveCustomers(customers) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function findCustomerByEmail(email) {
    return getCustomers().find(c => c.email.toLowerCase() === email.toLowerCase());
}

async function registerCustomer({ name, email, password }) {
    if (findCustomerByEmail(email)) {
        throw new Error('An account with this email already exists.');
    }
    const customers = getCustomers();
    const customer = {
        id: 'cust_' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await sha256(password),
        createdAt: new Date().toISOString()
    };
    customers.push(customer);
    saveCustomers(customers);
    return customer;
}

async function verifyCustomerLogin(email, password) {
    const customer = findCustomerByEmail(email);
    if (!customer) return null;
    const hash = await sha256(password);
    if (hash !== customer.passwordHash) return null;
    return customer;
}
