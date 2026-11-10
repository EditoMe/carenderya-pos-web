// Carenderya POS — Model (js/model.js)
// Owner: Member 1 (state + seed data + localStorage helpers)
// The model holds ALL application data in the single exported `state`
// object. It never touches the DOM. Functions mutate state and persist
// it to localStorage. The controller reads `state` and hands copies to
// the views via render().

export const CATEGORIES = [
  'All Menu', 'Ulam', 'Kanin', 'Sabaw', 'Inumin', 'Merienda', 'Extras',
];
export const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c !== 'All Menu');
export const ORDER_TYPES = ['Dine In', 'Take Away', 'Deliver'];
export const PAYMENT_METHODS = ['Cash', 'GCash', 'Card'];

const STORE_KEY = 'carenderya-pos-web-v1';
const DEFAULT_PIN = '1234';

const TINT_BY_CATEGORY = {
  Ulam: '#F7E3C8', Kanin: '#F1EAD9', Sabaw: '#FFE0D6',
  Inumin: '#DDEEDC', Merienda: '#FDEBC0', Extras: '#F9E3B8',
};

// Dishes, photos and prices match the Figma prototype 1:1.
const SEED_MENU = [
  { id: 'adobo',      name: 'Chicken Adobo',  price: 65, category: 'Ulam',     emoji: '🍗', photo: 'assets/images/dishes/adobo.jpg',      tint: '#F7E3C8', available: true, bestseller: true },
  { id: 'sinigang',   name: 'Pork Sinigang',  price: 80, category: 'Sabaw',    emoji: '🍲', photo: 'assets/images/dishes/sinigang.jpg',   tint: '#FFE0D6', available: true, bestseller: true },
  { id: 'kare',       name: 'Kare-Kare',      price: 95, category: 'Ulam',     emoji: '🥘', photo: 'assets/images/dishes/kare.jpg',       tint: '#F3E4C3', available: true },
  { id: 'kawali',     name: 'Lechon Kawali',  price: 90, category: 'Ulam',     emoji: '🥓', photo: 'assets/images/dishes/kawali.jpg',     tint: '#F6DCC8', available: true, bestseller: true },
  { id: 'canton',     name: 'Pancit Canton',  price: 50, category: 'Merienda', emoji: '🍜', photo: 'assets/images/dishes/canton.jpg',     tint: '#FDEBC0', available: true },
  { id: 'sisig',      name: 'Sisig',          price: 85, category: 'Ulam',     emoji: '🍳', photo: 'assets/images/dishes/sisig.jpg',      tint: '#F5D9C6', available: true, bestseller: true },
  { id: 'plain-rice', name: 'Plain Rice',     price: 15, category: 'Kanin',    emoji: '🍚', photo: 'assets/images/dishes/plain-rice.jpg', tint: '#F1EAD9', available: true },
  { id: 'halo',       name: 'Halo-Halo',      price: 55, category: 'Merienda', emoji: '🍨', photo: 'assets/images/dishes/halo.jpg',       tint: '#E4D9F5', available: true },
  { id: 'sago',       name: "Sago't Gulaman", price: 25, category: 'Inumin',   emoji: '🥤', photo: 'assets/images/dishes/sago.jpg',       tint: '#DDEEDC', available: true },
];

function seedOrders() {
  const now = Date.now();
  return [
    {
      id: 'DY1022', type: 'Dine In', status: 'Ready to Serve', payment: 'Cash',
      createdAt: now - 14 * 60_000,
      lines: [
        { id: 'adobo', qty: 1, name: 'Chicken Adobo', price: 65 },
        { id: 'plain-rice', qty: 2, name: 'Plain Rice', price: 15 },
      ],
      subtotal: 95, discount: 0, tax: 11.4, total: 106.4,
    },
    {
      id: 'DY1023', type: 'Take Away', status: 'In Progress',
      createdAt: now - 9 * 60_000,
      lines: [
        { id: 'sinigang', qty: 1, name: 'Pork Sinigang', price: 80 },
        { id: 'sago', qty: 1, name: "Sago't Gulaman", price: 25 },
      ],
      subtotal: 105, discount: 0, tax: 12.6, total: 117.6,
    },
    {
      id: 'DY1024', type: 'Deliver', status: 'In Progress',
      createdAt: now - 4 * 60_000,
      lines: [
        { id: 'sisig', qty: 2, name: 'Sisig', price: 85 },
        { id: 'plain-rice', qty: 2, name: 'Plain Rice', price: 15 },
      ],
      subtotal: 200, discount: 20, tax: 21.6, total: 201.6,
    },
  ];
}

function freshState() {
  return {
    menu: SEED_MENU.map((m) => ({ ...m })),
    cart: [
      { id: 'adobo', qty: 2 },
      { id: 'sinigang', qty: 1 },
      { id: 'sisig', qty: 1 },
    ],
    orderType: 'Dine In',
    promo: false,
    orders: seedOrders(),
    orderSeq: 1025,
    view: 'pos',            // which screen is visible (inside app)
    category: 'All Menu',   // POS category filter
    search: '',             // POS search text
    salesPeriod: 'all',     // history filter: day | week | month | year | all
    salesArchive: [],       // archived/reset sales snapshots for recent activity
    admin: { isAdmin: false, pin: DEFAULT_PIN, section: 'photos' },
    auth: { loggedIn: false, role: null, name: '', email: '', accountId: null }, // app login
    accounts: [],           // registered accounts {id, role, name, email, password, createdAt}
    staffPin: '0000',
    photos: {},             // { dishId: dataURL } owner-uploaded photos
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    const base = freshState();
    // Shallow-merge over defaults so new fields always exist.
    return {
      ...base,
      ...saved,
      salesArchive: Array.isArray(saved.salesArchive) ? saved.salesArchive : [],
      admin: { ...base.admin, ...(saved.admin || {}) },
      auth: { ...base.auth, ...(saved.auth || {}) },
      accounts: Array.isArray(saved.accounts) ? saved.accounts : [],
      staffPin: typeof saved.staffPin === 'string' ? saved.staffPin : base.staffPin,
    };
  } catch {
    return freshState();
  }
}

// The single exported state object required by the View-framework MVC rules.
export const state = loadState();

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // storage full/unavailable — the app keeps working in memory
  }
}

export function resetState() {
  localStorage.removeItem(STORE_KEY);
  Object.assign(state, freshState());
}

/* ---------- helpers (pure, no DOM) ---------- */

export const itemById = (id) => state.menu.find((m) => m.id === id);
export const priceOf = (id) => itemById(id)?.price ?? 0;
export const nameOf = (id) => itemById(id)?.name ?? id;
export const peso = (n) =>
  `₱${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

// Derived value: order totals recompute from the cart on every change.
export function cartTotals() {
  const subtotal = state.cart.reduce((s, l) => s + priceOf(l.id) * l.qty, 0);
  const discount = state.promo ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.12;
  return {
    subtotal, discount, tax,
    total: subtotal - discount + tax,
    count: state.cart.reduce((s, l) => s + l.qty, 0),
  };
}

/* ---------- cart ---------- */

export function addToCart(id) {
  const line = state.cart.find((l) => l.id === id);
  if (line) line.qty += 1;
  else state.cart.push({ id, qty: 1 });
  save();
}

export function removeFromCart(id) {
  const line = state.cart.find((l) => l.id === id);
  if (!line) return;
  line.qty -= 1;
  if (line.qty <= 0) state.cart = state.cart.filter((l) => l.id !== id);
  save();
}

export function setCartQty(id, qty) {
  if (qty <= 0) state.cart = state.cart.filter((l) => l.id !== id);
  else {
    const line = state.cart.find((l) => l.id === id);
    if (line) line.qty = qty;
  }
  save();
}

export function clearCart() {
  state.cart = [];
  state.promo = false;
  save();
}

export function setOrderType(type) {
  state.orderType = type;
  save();
}

export function setPromo(on) {
  state.promo = on;
  save();
}

/* ---------- UI (view selection lives in the model so a reload restores it) ---------- */

export function setView(view) {
  state.view = view;
  save();
}

export function setCategory(cat) {
  state.category = cat;
  save();
}

export function setSearch(q) {
  state.search = q;
  save();
}

/* ---------- orders ---------- */

export function placeOrder(payment) {
  const lines = state.cart.map((l) => ({
    ...l, name: nameOf(l.id), price: priceOf(l.id),
  }));
  const order = {
    id: `DY${state.orderSeq++}`,
    lines,
    type: state.orderType,
    status: 'In Progress',
    payment,
    createdAt: Date.now(),
    ...cartTotals(),
  };
  state.orders.unshift(order);
  state.cart = [];
  state.promo = false;
  save();
  return order;
}

export function updateOrderStatus(id, status) {
  const order = state.orders.find((o) => o.id === id);
  if (order) order.status = status;
  save();
}

export const findOrder = (id) => state.orders.find((o) => o.id === id);

/* ---------- sales history / archive ---------- */

export function setSalesPeriod(period) {
  state.salesPeriod = period;
  save();
}

function inPeriod(ts, period, now = new Date()) {
  const d = new Date(ts);
  if (period === 'all') return true;
  if (period === 'day') {
    return d.toDateString() === now.toDateString();
  }
  if (period === 'week') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6); // last 7 days including today
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }
  if (period === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === 'year') {
    return d.getFullYear() === now.getFullYear();
  }
  return true;
}

// Orders eligible for sales history (completed/cancelled) filtered by period.
export function salesOrdersByPeriod(period = state.salesPeriod) {
  return state.orders.filter(
    (o) =>
      (o.status === 'Completed' || o.status === 'Cancelled') &&
      inPeriod(o.createdAt, period),
  );
}

export function salesStatsByPeriod(period = state.salesPeriod) {
  const list = salesOrdersByPeriod(period);
  const completed = list.filter((o) => o.status === 'Completed');
  const sales = completed.reduce((s, o) => s + (o.total || 0), 0);
  return {
    sales,
    count: completed.length,
    avg: completed.length ? sales / completed.length : 0,
    orders: list.length,
  };
}

export function archiveByPeriod(period = state.salesPeriod) {
  return (state.salesArchive || []).filter((a) => inPeriod(a.archivedAt, period));
}

// Reset/clear current sales history by moving completed/cancelled orders into
// "Recent Activity" (archive). Active orders stay in the queue.
export function resetSalesHistory() {
  const toArchive = state.orders.filter(
    (o) => o.status === 'Completed' || o.status === 'Cancelled',
  );
  if (toArchive.length === 0) return null;

  const completed = toArchive.filter((o) => o.status === 'Completed');
  const sales = completed.reduce((s, o) => s + (o.total || 0), 0);
  const entry = {
    id: `AR${Date.now()}`,
    archivedAt: Date.now(),
    orders: toArchive,
    totals: {
      sales,
      count: completed.length,
      avg: completed.length ? sales / completed.length : 0,
      orders: toArchive.length,
    },
  };

  state.salesArchive = [entry, ...(state.salesArchive || [])];
  state.orders = state.orders.filter(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled',
  );
  save();
  return entry;
}

/* ---------- menu management (admin) ---------- */

export function toggleAvailable(id) {
  const item = itemById(id);
  if (item) item.available = !item.available;
  save();
}

export function updatePrice(id, price) {
  const item = itemById(id);
  if (!item || !(price > 0)) return false;
  item.price = Math.round(price * 100) / 100;
  save();
  return true;
}

export function addItem({ name, price, category, emoji }) {
  const id = `custom-${Date.now()}`;
  state.menu.push({
    id, name, price: Math.round(price * 100) / 100, category,
    emoji, tint: TINT_BY_CATEGORY[category] ?? '#F7E3C8',
    available: true, photo: null,
  });
  save();
  return id;
}

export function removeItem(id) {
  state.menu = state.menu.filter((m) => m.id !== id);
  state.cart = state.cart.filter((l) => l.id !== id);
  delete state.photos[id];
  save();
}

/* ---------- admin PIN ---------- */

export function unlockAdmin(pin) {
  if (pin === state.admin.pin) {
    state.admin.isAdmin = true;
    save();
    return true;
  }
  return false;
}

export function lockAdmin() {
  state.admin.isAdmin = false;
  save();
}

export function changePin(current, next) {
  if (current !== state.admin.pin || !/^\d{4,8}$/.test(next)) return false;
  state.admin.pin = next;
  save();
  return true;
}

export function setAdminSection(section) {
  state.admin.section = section;
  save();
}

/* ---------- owner photos (data URLs) ---------- */

export function setPhoto(id, dataUrl) {
  state.photos[id] = dataUrl;
  save();
}

export function removePhoto(id) {
  delete state.photos[id];
  save();
}

/* ---------- app login / accounts ---------- */

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isGmail(email) {
  return /^[a-z0-9._%+-]+@gmail\.com$/i.test(email);
}

export function loginOwner(pin) {
  if (pin === state.admin.pin) {
    state.auth = { loggedIn: true, role: 'owner', name: 'Owner', email: '', accountId: null };
    save();
    return true;
  }
  return false;
}

export function loginStaff(name, pin) {
  const n = String(name || '').trim();
  if (!n) return { ok: false, error: 'Enter the staff name.' };
  if (pin !== state.staffPin) return { ok: false, error: 'Incorrect staff PIN.' };
  state.auth = { loggedIn: true, role: 'staff', name: n, email: '', accountId: null };
  save();
  return { ok: true };
}

export function createAccount({ role, name, email, password }) {
  const n = String(name || '').trim();
  const e = normalizeEmail(email);
  const p = String(password || '');

  if (role !== 'owner' && role !== 'staff') {
    return { ok: false, error: 'Choose Owner or Staff.' };
  }
  if (!n) return { ok: false, error: 'Enter your name.' };
  if (!isGmail(e)) return { ok: false, error: 'Enter a valid Gmail address (example@gmail.com).' };
  if (p.length < 4) return { ok: false, error: 'Password must be at least 4 characters.' };
  if ((state.accounts || []).some((a) => normalizeEmail(a.email) === e)) {
    return { ok: false, error: 'An account with this Gmail already exists.' };
  }

  const account = {
    id: `acct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    name: n,
    email: e,
    password: p,
    createdAt: Date.now(),
  };
  state.accounts = [account, ...(state.accounts || [])];
  state.auth = { loggedIn: true, role, name: n, email: e, accountId: account.id };
  save();
  return { ok: true, account };
}

export function loginAccount(email, password) {
  const e = normalizeEmail(email);
  const p = String(password || '');
  if (!isGmail(e)) return { ok: false, error: 'Enter a valid Gmail address.' };
  if (!p) return { ok: false, error: 'Enter your password.' };
  const account = (state.accounts || []).find((a) => normalizeEmail(a.email) === e);
  if (!account) return { ok: false, error: 'No account found for this Gmail. Create an account first.' };
  if (account.password !== p) return { ok: false, error: 'Incorrect password.' };
  state.auth = {
    loggedIn: true,
    role: account.role,
    name: account.name,
    email: account.email,
    accountId: account.id,
  };
  save();
  return { ok: true, account };
}

export function logout() {
  state.auth = { loggedIn: false, role: null, name: '', email: '', accountId: null };
  state.admin.isAdmin = false; // also lock admin area on logout
  save();
}
