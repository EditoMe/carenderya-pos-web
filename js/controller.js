// Carenderya POS — Controller (js/controller.js)
// Owner: Member 2 (wiring) — imports the model AND the views, and is
// the ONLY layer that talks to both. Every user action flows:
//   View handler → controller function → model update → view re-render.
// The DOM-free model is never imported by any view, and views never
// touch the model directly.

import * as model from './model.js';
import { NavView } from './views/NavView.js';
import { PosView } from './views/PosView.js';
import { OrdersView } from './views/OrdersView.js';
import { HistoryView } from './views/HistoryView.js';
import { CheckoutView } from './views/CheckoutView.js';
import { MenuView } from './views/MenuView.js';
import { AdminView } from './views/AdminView.js';
import { LoginView } from './views/LoginView.js';

/* ---------- construct one view per parent element ---------- */

const $ = (s) => document.querySelector(s);

const navView = new NavView($('.rail'));
const posView = new PosView($('.pos'));
const ordersView = new OrdersView($('.orders-view'));
const historyView = new HistoryView($('.history-view'));
const checkoutView = new CheckoutView($('.checkout-view'));
const menuView = new MenuView($('.menu-view'));
const adminView = new AdminView($('.admin-view'));
const loginView = new LoginView($('.login-view'));

// Login gates the app; checkout is an overlay inside the app flow.
const loginEl = $('.login-view');
const checkoutParent = $('.checkout-view');
const appEl = $('.app');

/* ---------- controller-owned ephemeral UI state ---------- */

let openOrderId = null;      // order detail currently shown
let checkoutDraft = null;    // { method, tendered, error, doneId }
let adminPin = '';           // typed PIN (view-owned digits come via handlers)
let loginDraft = { mode: 'login', role: 'owner', name: '', email: '', password: '', error: '', success: '' };

/* ---------- render functions (hand state → view) ---------- */

function renderNav() {
  navView.render({ view: model.state.view, user: model.state.auth });
}

function renderPos() {
  posView.render({
    menu: model.state.menu,
    cart: model.state.cart,
    orders: model.state.orders,
    orderType: model.state.orderType,
    promo: model.state.promo,
    totals: model.cartTotals(),
    category: model.state.category,
    categories: model.CATEGORIES,
    search: model.state.search,
    photos: model.state.photos,
  });
}

function renderOrders() {
  if (openOrderId) {
    ordersView.renderDetail(model.findOrder(openOrderId));
  } else {
    ordersView.render({ orders: model.state.orders });
  }
}

function renderHistory() {
  const period = model.state.salesPeriod || 'all';
  historyView.render({
    period,
    orders: model.salesOrdersByPeriod(period),
    stats: model.salesStatsByPeriod(period),
    archive: model.archiveByPeriod(period),
  });
}

function renderCheckout() {
  const totals = model.cartTotals();
  checkoutView.render({
    totals,
    cartCount: model.state.cart.length,
    method: checkoutDraft.method,
    tendered: checkoutDraft.tendered,
    error: checkoutDraft.error,
    doneId: checkoutDraft.doneId,
    methods: model.PAYMENT_METHODS,
  });
}

function renderMenu() {
  menuView.render({
    menu: model.state.menu,
    category: model.state.category,
    categories: model.CATEGORIES,
    search: model.state.search,
    photos: model.state.photos,
  });
}

function renderAdmin() {
  adminView.render({
    isAdmin: model.state.admin.isAdmin,
    isDefaultPin: model.state.admin.pin === '1234',
    section: model.state.admin.section,
    menu: model.state.menu,
    photos: model.state.photos,
  });
}

function renderLogin() {
  loginEl.hidden = false;
  appEl.hidden = true;
  checkoutParent.hidden = true;
  loginView.render({ ...loginDraft });
}

function renderAll() {
  if (!model.state.auth?.loggedIn) {
    renderLogin();
    return;
  }

  // Guard: staff accounts must not access the admin dashboard.
  if (model.state.view === 'admin' && model.state.auth?.role !== 'owner') {
    model.state.view = 'pos';
  }

  loginEl.hidden = true;
  const { view } = model.state;
  appEl.hidden = view === 'checkout';
  checkoutParent.hidden = view !== 'checkout';

  navView._parentEl.style.display = view === 'checkout' ? 'none' : '';

  posView._parentEl.hidden = view !== 'pos';
  ordersView._parentEl.hidden = view !== 'orders';
  historyView._parentEl.hidden = view !== 'history';
  menuView._parentEl.hidden = view !== 'menu';
  adminView._parentEl.hidden = view !== 'admin';

  renderNav();
  if (view === 'pos') renderPos();
  if (view === 'orders') renderOrders();
  if (view === 'history') renderHistory();
  if (view === 'checkout') renderCheckout();
  if (view === 'menu') renderMenu();
  if (view === 'admin') renderAdmin();
}

/* ---------- controller functions (one per user action) ---------- */

export function controlNavigate(view) {
  // Staff accounts must not access the admin dashboard.
  if (view === 'admin' && model.state.auth?.role !== 'owner') {
    model.setView('pos');
    renderAll();
    return;
  }
  model.setView(view);
  renderAll();
}

export function controlOrderType(type) {
  model.setOrderType(type);
  renderPos();
}

export function controlCategory(cat) {
  model.setCategory(cat);
  if (model.state.view === 'pos') renderPos();
  else renderMenu();
}

export function controlSearch(input, inMenuView = false) {
  model.setSearch(input);
  // Re-rendering would steal the caret mid-typing in the POS view, so
  // the pos grid updates from the model without a full re-render:
  if (inMenuView) renderMenu();
  else {
    // POS view re-render also rebuilds the summary; caret is restored
    // by the view's _bindHandlers.
    renderPos();
  }
}

export function controlAddItem(id) {
  model.addToCart(id);
  renderPos();
}

export function controlRemoveItem(id) {
  model.removeFromCart(id);
  renderPos();
}

export function controlPromo() {
  model.setPromo(!model.state.promo);
  renderPos();
}

export function controlClearCart() {
  model.clearCart();
  renderPos();
}

export function controlCheckout() {
  checkoutDraft = { method: 'Cash', tendered: '', error: '', doneId: null };
  model.setView('checkout');
  renderAll();
}

export function controlCheckoutMethod(method) {
  checkoutDraft.method = method;
  checkoutDraft.error = '';
  renderCheckout();
}

export function controlCheckoutTendered(value) {
  checkoutDraft.tendered = value.replace(/[^0-9.]/g, '');
  renderCheckout();
}

export function controlCheckoutQuick(value) {
  checkoutDraft.tendered = String(value);
  renderCheckout();
}

export function controlApplyPromo(code) {
  model.applyPromoCode(code);
  renderPos();
}


export function controlConfirmPayment() {
  const { method, tendered } = checkoutDraft;
  if (method === 'Cash') {
    const cash = parseFloat(tendered);
    if (!Number.isFinite(cash) || tendered === '') {
      checkoutDraft.error = 'Enter the cash amount tendered.';
      renderCheckout();
      return;
    }
    if (cash < model.cartTotals().total) {
      checkoutDraft.error = 'Amount is not enough for the total due.';
      renderCheckout();
      return;
    }
  }
  const order = model.placeOrder(method);
  checkoutDraft.doneId = order.id;
  checkoutDraft.error = '';
  renderCheckout();
}

export function controlOrderStatus(id, next) {
  model.updateOrderStatus(id, next);
  renderOrders();
}

export function controlOpenOrder(id) {
  openOrderId = id;
  renderOrders();
}

export function controlBackToOrders() {
  openOrderId = null;
  renderOrders();
}

export function controlToggleAvailability(id) {
  model.toggleAvailable(id);
  renderMenu();
}

/* ---------- sales history (Member 2) ---------- */

export function controlSalesPeriod(period) {
  model.setSalesPeriod(period);
  renderHistory();
}

export function controlAskResetSales() {
  historyView.askReset();
  renderHistory();
}

export function controlCancelResetSales() {
  historyView.dismissReset();
  renderHistory();
}

export function controlConfirmResetSales() {
  model.resetSalesHistory();
  historyView.dismissReset();
  renderHistory();
}

/* ---------- admin (Member 3's controller functions) ---------- */

export function controlPinKey(digit) {
  if (adminPin.length < 8) adminPin += digit;
  adminView._pin = adminPin;
  adminView.setPinError('');
  renderAdmin();
}

export function controlPinBackspace() {
  adminPin = adminPin.slice(0, -1);
  adminView._pin = adminPin;
  renderAdmin();
}

export function controlUnlock() {
  if (model.unlockAdmin(adminPin)) {
    adminPin = '';
    adminView._pin = '';
    adminView.setPinError('');
    renderAdmin();
  } else {
    adminPin = '';
    adminView._pin = '';
    adminView.setPinError('Wrong PIN — try again');
    renderAdmin();
  }
}

export function controlLock() {
  model.lockAdmin();
  adminPin = '';
  adminView._pin = '';
  adminView.setPinError('');
  renderAdmin();
}

export function controlAdminSection(section) {
  model.setAdminSection(section);
  adminPin = '';
  adminView._pin = '';
  adminView.setPinError('');
  renderAdmin();
}

export function controlAddProduct(form) {
  const name = (form.name ?? '').trim();
  const price = parseFloat(form.price);

  if (name.length === 0) {
    adminView.setFormMsg('⚠️ Give the new product a name.');
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    adminView.setFormMsg('⚠️ Enter a price greater than zero.');
    return;
  }
  model.addItem({
    name,
    price,
    category: form.category,
    emoji: form.emoji,
  });
  adminView.setFormMsg(`✓ "${name}" added — set its photo under the Photos tab.`);
  // Re-render the admin panel (keeps the add form + new list row).
  adminView._form = { name: '', price: '', category: form.category, emoji: form.emoji };
  renderAdmin();
}

export function controlEditPrice(id, draft, save = false) {
  if (!save) {
    const item = model.itemById(id);
    adminView.startPriceEdit(id, item.price);
    renderAdmin();
    return;
  }
  const value = parseFloat(draft);
  if (!Number.isFinite(value) || value <= 0) {
    adminView.setPriceErr('Enter a price greater than zero.');
    renderAdmin();
    return;
  }
  model.updatePrice(id, value);
  adminView.cancelPriceEdit();
  renderAdmin();
}

export function controlRemoveProduct(id, confirm = false) {
  const item = model.itemById(id);
  if (!confirm) {
    adminView.askRemove(id, item?.name ?? id);
    renderAdmin();
    return;
  }
  model.removeItem(id);
  adminView.dismissRemove();
  renderAdmin();
}

export function controlPhoto(id, file) {
  const reader = new FileReader();
  reader.onload = () => {
    model.setPhoto(id, String(reader.result));
    renderAdmin();
  };
  reader.readAsDataURL(file);
}

export function controlRemovePhoto(id) {
  model.removePhoto(id);
  renderAdmin();
}

export function controlChangePin(current, next) {
  const ok = model.changePin(current, next);
  adminView.setPinMsg(
    ok ? 'PIN updated.' : 'Failed — check current PIN (new PIN must be 4–8 digits).',
  );
  renderAdmin();
}

/* ---------- login / account creation (Gmail) ---------- */

export function controlLoginMode(mode) {
  loginDraft.mode = mode === 'create' ? 'create' : 'login';
  loginDraft.error = '';
  loginDraft.success = '';
  loginDraft.password = '';
  renderLogin();
}

export function controlLoginRole(role) {
  loginDraft.role = role === 'staff' ? 'staff' : 'owner';
  loginDraft.error = '';
  renderLogin();
}

export function controlLoginField(field, value) {
  if (field === 'name') loginDraft.name = String(value || '').slice(0, 60);
  if (field === 'email') loginDraft.email = String(value || '').slice(0, 120);
  if (field === 'password') loginDraft.password = String(value || '').slice(0, 60);
  loginDraft.error = '';
  loginDraft.success = '';
  // avoid full re-render on keystrokes to keep typing smooth
}

export function controlLoginSubmit() {
  if (loginDraft.mode === 'create') {
    const res = model.createAccount({
      role: loginDraft.role,
      name: loginDraft.name,
      email: loginDraft.email,
      password: loginDraft.password,
    });
    if (!res.ok) {
      loginDraft.error = res.error || 'Could not create account.';
      renderLogin();
      return;
    }
    loginDraft = { mode: 'login', role: 'owner', name: '', email: '', password: '', error: '', success: '' };
    renderAll();
    return;
  }

  const res = model.loginAccount(loginDraft.email, loginDraft.password);
  if (!res.ok) {
    loginDraft.error = res.error || 'Login failed.';
    renderLogin();
    return;
  }
  loginDraft = { mode: 'login', role: 'owner', name: '', email: '', password: '', error: '', success: '' };
  renderAll();
}

export function controlLogout() {
  model.logout();
  loginDraft = { mode: 'login', role: 'owner', name: '', email: '', password: '', error: '', success: '' };
  renderAll();
}

/* ---------- wire every view handler to its controller function ---------- */

loginView.addHandlerMode(controlLoginMode);
loginView.addHandlerRole(controlLoginRole);
loginView.addHandlerField(controlLoginField);
loginView.addHandlerSubmit(controlLoginSubmit);

navView.addHandlerNavigate(controlNavigate);
navView.addHandlerLogout(controlLogout);

posView.addHandlerOrderType(controlOrderType);
posView.addHandlerCategory(controlCategory);
posView.addHandlerSearch((q) => controlSearch(q));
posView.addHandlerAdd(controlAddItem);
posView.addHandlerRemove(controlRemoveItem);
posView.addHandlerPromo(controlPromo);
posView.addHandlerClear(controlClearCart);
posView.addHandlerCheckout(controlCheckout);

ordersView.addHandlerStatus(controlOrderStatus);
ordersView.addHandlerOrderId(controlOpenOrder);
ordersView.addHandlerBack(controlBackToOrders);

checkoutView.addHandlerMethod(controlCheckoutMethod);
checkoutView.addHandlerTendered(controlCheckoutTendered);
checkoutView.addHandlerQuick(controlCheckoutQuick);
checkoutView.addHandlerConfirm(controlConfirmPayment);
checkoutView.addHandlerBack(() => controlNavigate('pos'));
checkoutView.addHandlerNavigate(controlNavigate);

menuView.addHandlerToggle(controlToggleAvailability);
menuView.addHandlerCategory(controlCategory);
menuView.addHandlerSearch((q) => controlSearch(q, true));

historyView.addHandlerPeriod(controlSalesPeriod);
historyView.addHandlerReset(controlAskResetSales);
historyView.addHandlerConfirmReset(controlConfirmResetSales);
historyView.addHandlerCancelReset(controlCancelResetSales);

adminView.addHandlerKey(controlPinKey);
adminView.addHandlerBackspace(controlPinBackspace);
adminView.addHandlerUnlock(controlUnlock);
adminView.addHandlerLock(controlLock);
adminView.addHandlerSection(controlAdminSection);
adminView.addHandlerAddItem(controlAddProduct);
adminView.addHandlerEditPrice((id, draft, save) => controlEditPrice(id, draft, save));
adminView.addHandlerRemove((id, confirm) => controlRemoveProduct(id, confirm));
adminView.addHandlerPhoto(controlPhoto);
adminView.addHandlerRemovePhoto(controlRemovePhoto);
adminView.addHandlerChangePin(controlChangePin);

posView.addHandlerApplyPromo(controlApplyPromo);

/* ---------- boot ---------- */

renderAll();
