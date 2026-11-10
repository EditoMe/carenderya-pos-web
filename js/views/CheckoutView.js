// CheckoutView — payment form with validation. Owner: Member 2
// Renders into <section class="checkout-view">.
//
// This view owns the form-validation requirement: the payment form
// validates the cash tendered amount and renders the error message
// through the view (`form-error` element) — the model never knows the
// DOM. The controller subscribes:
//   addHandlerMethod(method)   — payment method chips
//   addHandlerTendered(value)  — typing in the cash input
//   addHandlerQuick(value)     — quick cash chips
//   addHandlerConfirm()        — confirm payment button
//   addHandlerBack()           — back to POS
//   addHandlerNavigate(view)   — success screen links
import { View, peso } from './View.js';

export class CheckoutView extends View {
  _generateMarkup() {
    const { totals, cartCount, method, tendered, error, doneId, methods } = this._data;

    if (doneId) {
      return `
        <div style="text-align:center;padding:40px 0">
          <div style="font-size:56px">✅</div>
          <div class="view-title" style="margin-top:8px">Order #${doneId} placed!</div>
          <div class="view-sub">Paid via ${method} • ${peso(totals.total)}</div>
          <div class="order-actions" style="justify-content:center">
            <button class="action-btn done" data-goto="orders">View in Orders</button>
            <button class="back-btn" data-goto="pos">Back to POS</button>
          </div>
        </div>`;
    }

    const cash = parseFloat(tendered) || 0;
    const change = cash - totals.total;
    const insufficient = method === 'Cash' && tendered !== '' && change < 0;
    const disabled = cartCount === 0 || (method === 'Cash' && change < 0);

    return `
      <div class="co-top">
        <button class="back-btn" data-back>‹ Back</button>
        <span class="co-title">Checkout</span>
        <span style="font-size:11px;color:#8b8378">${cartCount === 0 ? 'Cart empty' : `${cartCount} line(s)`}</span>
      </div>

      <div class="co-cols">
        <div class="co-col">
          <div class="co-label">Payment method</div>
          <div class="methods">
            ${methods.map((m) => `
              <button class="method ${method === m ? 'active' : ''}" data-method="${m}">
                ${m === 'Cash' ? '💵' : m === 'GCash' ? '📱' : '💳'} ${m}
              </button>`).join('')}
          </div>

          ${method === 'Cash' ? `
            <div class="co-label">Cash tendered</div>
            <input class="co-input" id="cash-input" type="text" inputmode="decimal"
                   placeholder="0.00" value="${tendered}">
            <div class="quick">
              ${[100, 200, 500, 1000].map((v) => `
                <button class="chip" data-quick="${v}">₱${v}</button>`).join('')}
            </div>
            <div class="form-error ${error || insufficient ? 'show' : ''}" id="cash-error">
              ${error || (insufficient ? 'Amount is not enough for the total due.' : '')}
            </div>` : `
            <div style="font-size:12px;color:#8b8378;margin-top:10px">
              Paying via ${method}. Confirm below to place the order.
            </div>`}
        </div>

        <div class="co-col">
          <div class="co-sums">
            <div class="sum-row"><span class="k">Subtotal</span><span class="v">${peso(totals.subtotal)}</span></div>
            <div class="sum-row"><span class="k">Discount</span><span class="v">${totals.discount > 0 ? '-' + peso(totals.discount) : peso(0)}</span></div>
            <div class="sum-row"><span class="k">Tax (12%)</span><span class="v">${peso(totals.tax)}</span></div>
            <div class="sum-row total"><span class="k">Total due</span><span class="v">${peso(totals.total)}</span></div>
            ${method === 'Cash' && tendered !== '' ? `
              <div class="sum-row total"><span class="k">Change</span>
                <span class="v">${change >= 0 ? peso(change) : 'Insufficient'}</span></div>` : ''}
          </div>
          <button class="confirm-btn" data-confirm ${disabled ? 'disabled' : ''}>
            Confirm Payment • ${peso(totals.total)}
          </button>
        </div>
      </div>`;
  }

  addHandlerMethod(h) { this._method = h; }
  addHandlerTendered(h) { this._tendered = h; }
  addHandlerQuick(h) { this._quick = h; }
  addHandlerConfirm(h) { this._confirm = h; }
  addHandlerBack(h) { this._back = h; }
  addHandlerNavigate(h) { this._go = h; }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('[data-method]').forEach((b) =>
      b.addEventListener('click', () => self._method(b.dataset.method)));
    this._parentEl.querySelectorAll('[data-quick]').forEach((b) =>
      b.addEventListener('click', () => self._quick(b.dataset.quick)));
    const confirm = this._parentEl.querySelector('[data-confirm]');
    if (confirm) confirm.addEventListener('click', () => self._confirm());
    const back = this._parentEl.querySelector('[data-back]');
    if (back) back.addEventListener('click', () => self._back());
    this._parentEl.querySelectorAll('[data-goto]').forEach((b) =>
      b.addEventListener('click', () => self._go(b.dataset.goto)));

    const input = this._parentEl.querySelector('#cash-input');
    if (input) {
      input.addEventListener('input', () => self._tendered(input.value));
    }
  }
}
