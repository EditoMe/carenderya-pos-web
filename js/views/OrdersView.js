// OrdersView — active orders queue + order detail. Owner: Member 2
// Renders into <section class="orders-view"> (queue) and can either
// render a single order detail (renderDetail) or the queue (render).
//
// Handler methods exposed:
//   addHandlerStatus(orderId, nextStatus)  — advance / cancel an order
//   addHandlerOrderId(handler)             — click an order to open detail
//   addHandlerBack()                       — back from detail to queue
import { View, peso, esc } from './View.js';

const STATUS_CLASS = {
  'In Progress': 'progress',
  'Ready to Serve': 'ready',
  Completed: 'done',
  Cancelled: 'cancelled',
};

const NEXT = {
  'In Progress': ['Ready to Serve', 'Cancelled'],
  'Ready to Serve': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const btnClass = (s) =>
  s === 'Completed' ? 'action-btn done' : s === 'Cancelled' ? 'action-btn danger' : 'action-btn';

export class OrdersView extends View {
  _generateMarkup() {
    const orders = this._data.orders;
    const active = orders.filter(
      (o) => o.status === 'In Progress' || o.status === 'Ready to Serve',
    );
    return `
      <div class="view-title">Active Orders</div>
      <div class="view-sub">${active.length} orders in the kitchen queue</div>
      ${orders.length === 0 ? '<div class="empty">No orders yet.</div>' : ''}
      ${orders.map((o) => `
        <div class="order-card">
          <div class="order-top">
            <div>
              <a class="order-id order-id-link" href="#" data-open="${o.id}">Order #${o.id}</a>
              <div class="order-meta">${o.type} • ${o.lines.reduce((s, l) => s + l.qty, 0)} items • ${peso(o.total)}</div>
            </div>
            <span class="status-pill ${STATUS_CLASS[o.status]}">${o.status}</span>
          </div>
          <div class="order-actions">
            ${NEXT[o.status].map((s) => `
              <button class="${btnClass(s)}" data-status="${o.id}" data-next="${s}">Mark ${s}</button>
            `).join('')}
            ${NEXT[o.status].length === 0 ? '<span class="action-btn light">No further actions</span>' : ''}
          </div>
        </div>`).join('')}`;
  }

  // Detail page for one order. The controller calls this instead of
  // render() when the user opens an order.
  renderDetail(order) {
    this._data = { order };
    this._parentEl.innerHTML = this._generateMarkupDetail(order);
    this._bindHandlers();
  }

  _generateMarkupDetail(order) {
    if (!order) {
      return `<div class="view-title">Order not found</div>
        <button class="back-btn" data-back>‹ Back to orders</button>`;
    }
    return `
      <div class="order-top">
        <div>
          <div class="view-title">Order #${order.id}</div>
          <div class="view-sub">${order.type} • ${order.payment ? `Paid via ${order.payment}` : 'Unpaid'} • ${new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <span class="status-pill ${STATUS_CLASS[order.status]}">${order.status}</span>
      </div>
      <div class="detail-card">
        ${order.lines.map((l) => `
          <div class="sum-row"><span>${l.qty}× ${esc(l.name)}</span><span class="v">${peso(l.price * l.qty)}</span></div>
        `).join('')}
        <div class="div"></div>
        <div class="sum-row"><span class="k">Subtotal</span><span class="v">${peso(order.subtotal)}</span></div>
        <div class="sum-row"><span class="k">Discount</span><span class="v">${order.discount > 0 ? '-' + peso(order.discount) : peso(0)}</span></div>
        <div class="sum-row"><span class="k">Tax (12%)</span><span class="v">${peso(order.tax)}</span></div>
        <div class="sum-row total"><span class="k">Total</span><span class="v">${peso(order.total)}</span></div>
      </div>
      <div class="order-actions">
        ${NEXT[order.status].map((s) => `
          <button class="${btnClass(s)}" data-status="${order.id}" data-next="${s}">Mark ${s}</button>
        `).join('')}
        <button class="back-btn" data-back>‹ Back to orders</button>
      </div>`;
  }

  addHandlerStatus(h) { this._status = h; }
  addHandlerOrderId(h) { this._open = h; }
  addHandlerBack(h) { this._back = h; }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('[data-status]').forEach((b) =>
      b.addEventListener('click', () => self._status(b.dataset.status, b.dataset.next)));
    this._parentEl.querySelectorAll('[data-open]').forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        self._open(a.dataset.open);
      }));
    const back = this._parentEl.querySelector('[data-back]');
    if (back) back.addEventListener('click', () => self._back());
  }
}
