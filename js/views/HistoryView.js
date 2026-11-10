// HistoryView — sales history, period filters, and recent activity (archives).
// Owner: Member 2. Renders into <section class="history-view">.
// Handler methods exposed:
//   addHandlerPeriod(period)   — Day/Week/Month/Year/All filter
//   addHandlerReset()          — ask to reset/archive sales history
//   addHandlerConfirmReset()   — confirm reset
//   addHandlerCancelReset()    — dismiss reset modal
import { View, peso, esc } from './View.js';

const STATUS_CLASS = {
  'Ready to Serve': 'ready', 'In Progress': 'progress',
  Completed: 'done', Cancelled: 'cancelled',
};

const PERIODS = [
  ['day', 'Today'],
  ['week', 'Week'],
  ['month', 'Month'],
  ['year', 'Year'],
  ['all', 'All'],
];

export class HistoryView extends View {
  constructor(parentEl) {
    super(parentEl);
    this._confirmReset = false;
  }

  askReset() { this._confirmReset = true; }
  dismissReset() { this._confirmReset = false; }

  _generateMarkup() {
    const { orders, stats, archive, period } = this._data;
    const label = PERIODS.find(([p]) => p === period)?.[1] || 'All';

    return `
      <div class="admin-head" style="margin-bottom:6px">
        <div>
          <div class="view-title">Sales History</div>
          <div class="view-sub">View sales by day, week, month, or year</div>
        </div>
        <button class="action-btn danger" data-reset-history ${orders.length === 0 ? 'disabled' : ''}>Reset Sales History</button>
      </div>

      <div class="cat-row" style="margin-bottom:10px">
        ${PERIODS.map(([id, name]) => `
          <button class="pill ${period === id ? 'active' : ''}" data-period="${id}">${name}</button>`).join('')}
      </div>

      <div class="stats">
        <div class="stat"><div class="stat-label">Total Sales (${label})</div><div class="stat-value">${peso(stats.sales)}</div></div>
        <div class="stat"><div class="stat-label">Completed Orders</div><div class="stat-value">${stats.count}</div></div>
        <div class="stat"><div class="stat-label">Avg. Order</div><div class="stat-value">${peso(stats.avg)}</div></div>
      </div>

      <div class="section-title">Current sales (${label})</div>
      ${orders.length === 0 ? '<div class="empty">No completed/cancelled orders in this period. Use Reset to move current history into Recent Activity.</div>' : ''}
      ${orders.map((o) => `
        <div class="order-card">
          <div class="order-top">
            <div>
              <div class="order-id">Order #${o.id}</div>
              <div class="order-meta">${o.type} • ${o.payment ?? '—'} • ${new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div style="text-align:right">
              <div class="order-id">${peso(o.total)}</div>
              <span class="status-pill ${STATUS_CLASS[o.status]}">${o.status}</span>
            </div>
          </div>
        </div>`).join('')}

      <div class="section-title" style="margin-top:14px">Recent Activity (archived resets)</div>
      <div class="view-sub">Each reset moves sales history here so you can review it by period.</div>
      ${archive.length === 0 ? '<div class="empty">No archived sales yet. Resetting sales history will add an entry here.</div>' : ''}
      ${archive.map((a) => `
        <div class="order-card">
          <div class="order-top">
            <div>
              <div class="order-id">Archived ${new Date(a.archivedAt).toLocaleString()}</div>
              <div class="order-meta">${a.totals.orders} order(s) • ${a.totals.count} completed • Avg ${peso(a.totals.avg)}</div>
            </div>
            <div style="text-align:right">
              <div class="order-id">${peso(a.totals.sales)}</div>
              <span class="status-pill done">Archived</span>
            </div>
          </div>
          <div class="view-sub" style="margin-top:6px">Orders: ${a.orders.map((o) => `#${esc(o.id)}`).join(', ')}</div>
        </div>`).join('')}

      ${this._confirmReset ? `
        <div class="modal-dim show">
          <div class="modal-card">
            <div class="modal-title">Reset sales history?</div>
            <div class="modal-sub">Current completed/cancelled orders will be moved to <b>Recent Activity</b> (archived) so you can still review sales by day, week, month, and year. Active orders in the queue stay as-is.</div>
            <div class="modal-btns">
              <button class="admin-btn ghost" data-cancel-reset>Cancel</button>
              <button class="admin-btn danger" data-confirm-reset>Reset & Archive</button>
            </div>
          </div>
        </div>` : ''}`;
  }

  addHandlerPeriod(h) { this._period = h; }
  addHandlerReset(h) { this._reset = h; }
  addHandlerConfirmReset(h) { this._confirmResetH = h; }
  addHandlerCancelReset(h) { this._cancelReset = h; }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('[data-period]').forEach((b) =>
      b.addEventListener('click', () => self._period(b.dataset.period)));
    const reset = this._parentEl.querySelector('[data-reset-history]');
    if (reset) reset.addEventListener('click', () => self._reset());
    const confirm = this._parentEl.querySelector('[data-confirm-reset]');
    if (confirm) confirm.addEventListener('click', () => self._confirmResetH());
    const cancel = this._parentEl.querySelector('[data-cancel-reset]');
    if (cancel) cancel.addEventListener('click', () => self._cancelReset());
  }
}
