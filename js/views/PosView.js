// PosView — POS terminal: header, analytics strip, category pills,
// menu grid and order summary. Renders into <main class="pos">.
// Owner: Member 1.
//
// Handler methods exposed (subscribed by the controller):
//   addHandlerOrderType, addHandlerCategory, addHandlerSearch,
//   addHandlerAdd, addHandlerRemove, addHandlerQty,
//   addHandlerPromo, addHandlerClear, addHandlerCheckout
import { View, peso, esc, imgTag } from './View.js';

const STATUS_CLASS = {
  'In Progress': 'progress',
  'Ready to Serve': 'ready',
  Completed: 'done',
  Cancelled: 'cancelled',
};

export class PosView extends View {
  _generateMarkup() {
    const {
      menu, cart, orders, orderType, promo, totals,
      category, categories, search, photos,
    } = this._data;

    const active = orders.filter(
      (o) => o.status === 'In Progress' || o.status === 'Ready to Serve',
    );
    const salesTotal = active.reduce((s, o) => s + o.total, 0) + totals.total;

    const items = menu.filter(
      (m) =>
        (category === 'All Menu' || m.category === category) &&
        m.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    const qtyOf = (id) => cart.find((l) => l.id === id)?.qty ?? 0;
    const itemOf = (id) => menu.find((m) => m.id === id);

    return `
    <div class="pos-main">
      <div class="pos-head">
        <div>
          <div class="brand">🍲 Carenderya POS</div>
          <div class="brand-sub">carenderya-pos-dashboard</div>
        </div>
        <div class="type-row">
          ${['Dine In', 'Take Away', 'Deliver'].map((t) => `
            <button class="type-btn ${orderType === t ? 'active' : ''}" data-type="${t}">${t}</button>
          `).join('')}
          <button class="cancel-btn" data-action="clear">Cancel</button>
        </div>
      </div>

      <div class="analytics">
        <div class="sales-card">
          <div class="sales-title">Sales Analytics</div>
          <div class="sales-value">${peso(salesTotal)}</div>
          <div class="sales-sub">${active.length} active orders today</div>
        </div>
        ${active.slice(0, 3).map((o) => `
          <div class="order-chip">
            <div class="order-chip-id">Order #${o.id}</div>
            <span class="status-pill ${STATUS_CLASS[o.status]}">${o.status}</span>
          </div>`).join('')}
      </div>

      <div class="cat-row">
        ${categories.map((c) => `
          <button class="pill ${category === c ? 'active' : ''}" data-cat="${c}">${c}</button>
        `).join('')}
        <input class="search" id="pos-search" type="text" placeholder="Search…" value="${esc(search)}">
      </div>

      <div class="section-title">Menu Items</div>
      <div class="grid">
        ${items.length === 0 ? `<div class="empty">No dishes match your search.</div>` : ''}
        ${items.map((m) => {
          const q = qtyOf(m.id);
          return `
          <div class="card ${m.available ? '' : 'unavailable'}">
            <div class="card-img" style="background:${m.tint}">
              ${imgTag(m, photos[m.id])}
              ${m.bestseller ? '<span class="badge">★ Best</span>' : ''}
            </div>
            <div class="card-name">${esc(m.name)}</div>
            <div class="card-price">${peso(m.price)}</div>
            ${q === 0
              ? `<button class="add-btn" data-add="${m.id}" ${m.available ? '' : 'disabled'}>Add Item +</button>`
              : `<div class="stepper">
                   <button class="step-btn" data-dec="${m.id}">−</button>
                   <span class="step-q">${q}</span>
                   <button class="step-btn plus" data-add="${m.id}">+</button>
                 </div>`}
          </div>`;
        }).join('')}
      </div>
    </div>

    <aside class="summary">
      <div class="summary-title">Order's Summary</div>
      <div class="summary-sub">${orderType} • Total items (${totals.count})</div>
      <div class="summary-lines">
        ${cart.length === 0 ? `<div class="empty">🧾<br>No items yet. Tap Add Item to start an order.</div>` : ''}
        ${cart.map((l) => {
          const m = itemOf(l.id);
          if (!m) return '';
          return `
          <div class="line">
            <div class="thumb-sm">${imgTag(m, photos[m.id])}</div>
            <div class="line-mid">
              <div class="line-name">${esc(m.name)}</div>
              <div class="line-price">${peso(m.price)}</div>
            </div>
            <div class="q-row">
              <button class="q-btn" data-dec="${l.id}">−</button>
              <span class="q">${l.qty}</span>
              <button class="q-btn" data-add="${l.id}">+</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      <button class="promo ${promo ? 'on' : ''}" data-action="promo">
        ${promo ? '✓ ' : ''}Promo 10% OFF applied
      </button>
      <div class="sums">
        <div class="sum-row"><span class="k">Price</span><span class="v">${peso(totals.subtotal)}</span></div>
        <div class="sum-row"><span class="k">Discount</span><span class="v">${totals.discount > 0 ? '-' + peso(totals.discount) : peso(0)}</span></div>
        <div class="sum-row"><span class="k">Tax (12%)</span><span class="v">${peso(totals.tax)}</span></div>
        <div class="div"></div>
        <div class="sum-row total"><span class="k">Total</span><span class="v">${peso(totals.total)}</span></div>
      </div>
      <button class="place-btn" data-action="checkout" ${cart.length === 0 ? 'disabled' : ''}>
        Place Order • ${peso(totals.total)}
      </button>
    </aside>`;
  }

  addHandlerOrderType(h) { this._orderType = h; }
  addHandlerCategory(h) { this._category = h; }
  addHandlerSearch(h) { this._search = h; }
  addHandlerAdd(h) { this._add = h; }
  addHandlerRemove(h) { this._remove = h; }
  addHandlerPromo(h) { this._promo = h; }
  addHandlerClear(h) { this._clear = h; }
  addHandlerCheckout(h) { this._checkout = h; }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('.type-btn').forEach((b) =>
      b.addEventListener('click', () => self._orderType(b.dataset.type)));
    this._parentEl.querySelectorAll('.pill').forEach((b) =>
      b.addEventListener('click', () => self._category(b.dataset.cat)));
    this._parentEl.querySelectorAll('[data-add]').forEach((b) =>
      b.addEventListener('click', () => self._add(b.dataset.add)));
    this._parentEl.querySelectorAll('[data-dec]').forEach((b) =>
      b.addEventListener('click', () => self._remove(b.dataset.dec)));
    const promo = this._parentEl.querySelector('[data-action="promo"]');
    if (promo) promo.addEventListener('click', () => self._promo());
    const clear = this._parentEl.querySelector('[data-action="clear"]');
    if (clear) clear.addEventListener('click', () => self._clear());
    const checkout = this._parentEl.querySelector('[data-action="checkout"]');
    if (checkout) checkout.addEventListener('click', () => self._checkout());

    const search = this._parentEl.querySelector('#pos-search');
    if (search) {
      search.addEventListener('input', () => self._search(search.value));
    }
  }
}
