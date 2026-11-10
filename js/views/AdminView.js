// AdminView — owner area: PIN gate, products (add/edit price/remove),
// photos and PIN change. Renders into <section class="admin-view">.
// Owner: Member 3.
//
// Handler methods exposed (subscribed by the controller):
//   addHandlerKey(digit)          — PIN pad keys
//   addHandlerBackspace()
//   addHandlerUnlock()
//   addHandlerLock()
//   addHandlerSection(section)    — photos | products | pin tabs
//   addHandlerAddItem(formData)   — validation errors render via formMsg
//   addHandlerEditPrice(id, raw)  — inline price editor
//   addHandlerRemove(id)          — confirm modal → removes
//   addHandlerPhoto(id, file)     — photo upload (File → data URL)
//   addHandlerRemovePhoto(id)
//   addHandlerChangePin(current, next)
//
// Local (view-owned) UI state lives here, NOT in the model: the typed
// PIN, the add-product form drafts, the inline price editor and the
// remove-confirm modal target. Only durable data reaches the model.
import { View, peso, esc, imgTag } from './View.js';

const PRODUCT_CATS = ['Ulam', 'Kanin', 'Sabaw', 'Inumin', 'Merienda', 'Extras'];
const EMOJIS = ['🍽️', '🍗', '🍲', '🥘', '🍜', '🍚', '🍨', '🥤', '🍳', '🥟', '🍌', '🥓', '🍖'];

export class AdminView extends View {
  constructor(parentEl) {
    super(parentEl);
    this._pin = '';
    this._pinError = '';
    this._form = { name: '', price: '', category: 'Ulam', emoji: '🍽️' };
    this._formMsg = '';
    this._editingId = null;
    this._priceDraft = '';
    this._priceErr = '';
    this._pendingRemove = null;
    this._pinForm = { current: '', next: '' };
    this._pinMsg = '';
  }

  _generateMarkup() {
    const { isAdmin, isDefaultPin, section, menu, photos } = this._data;
    return isAdmin
      ? this._panelMarkup({ isDefaultPin, section, menu, photos })
      : this._gateMarkup();
  }

  _gateMarkup() {
    const dots = Array.from({ length: Math.max(4, this._pin.length) })
      .map((_, i) => `<span class="pin-dot ${i < this._pin.length ? 'on' : ''}"></span>`)
      .join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
      .map((k) => k === ''
        ? '<span></span>'
        : `<button class="pin-key" data-key="${k}">${k}</button>`)
      .join('');
    return `
      <div class="pin-center">
        <div class="pin-emoji">🔐</div>
        <div class="view-title" style="margin-top:8px">Owner / Admin Only</div>
        <div class="view-sub">Enter your admin PIN to manage dish photos and products.</div>
        <div class="pin-dots">${dots}</div>
        <div class="pin-error">${this._pinError}</div>
        <div class="pin-pad">${keys}</div>
        <button class="unlock-btn" data-unlock ${this._pin.length < 4 ? 'disabled' : ''}>Unlock Admin</button>
        <div class="pin-hint">Default PIN: 1234 (change it after first login)</div>
      </div>`;
  }

  _panelMarkup({ isDefaultPin, section, menu, photos }) {
    const tabs = [['photos', '📷 Photos'], ['products', '🍽️ Products'], ['pin', '🔑 PIN']];
    return `
      <div class="admin-head">
        <div class="seg">
          ${tabs.map(([id, label]) => `
            <button class="seg-btn ${section === id ? 'active' : ''}" data-section="${id}">${label}</button>`).join('')}
        </div>
        <button class="lock-btn" data-lock>Lock 🔒</button>
      </div>
      ${isDefaultPin ? '<div class="warn">⚠️ You are still using the default PIN (1234). Change it under the PIN tab.</div>' : ''}
      ${section === 'photos' ? this._photosMarkup(menu, photos) : ''}
      ${section === 'products' ? this._productsMarkup(menu) : ''}
      ${section === 'pin' ? this._pinMarkup() : ''}`;
  }

  _photosMarkup(menu, photos) {
    return `
      <div class="view-sub">Photos are saved on this device and shown across POS, orders and menu.</div>
      ${menu.map((m) => {
        const uri = photos[m.id];
        return `
        <div class="menu-row">
          <div class="thumb" style="background:${m.tint}">${imgTag(m, uri)}</div>
          <div style="flex:1">
            <div class="card-name">${esc(m.name)}</div>
            <div class="card-price">${m.category} • ${peso(m.price)} • ${uri ? '📷 Owner photo' : m.photo ? '🖼️ Prototype photo' : 'Emoji art'}</div>
          </div>
          <label class="admin-btn" style="cursor:pointer">
            🖼️ Upload
            <input type="file" accept="image/*" data-photo="${m.id}" hidden>
          </label>
          ${uri ? `<button class="admin-btn danger" data-remove-photo="${m.id}">Remove</button>` : ''}
        </div>`;
      }).join('')}`;
  }

  _productsMarkup(menu) {
    const f = this._form;
    return `
      <div class="add-form">
        <div class="add-form-title">＋ Add new product</div>
        <div class="form-row">
          <div style="flex:2">
            <div class="co-label">Name</div>
            <input class="admin-input" id="np-name" type="text" placeholder="e.g. Chicken Curry" value="${esc(f.name)}" style="width:100%">
          </div>
          <div style="flex:1">
            <div class="co-label">Price (₱)</div>
            <input class="admin-input" id="np-price" type="text" inputmode="decimal" placeholder="0.00" value="${esc(f.price)}" style="width:100%">
          </div>
        </div>
        <div class="co-label">Category</div>
        <div class="cat-row">
          ${PRODUCT_CATS.map((c) => `<button class="pill ${f.category === c ? 'active' : ''}" data-npcat="${c}">${c}</button>`).join('')}
        </div>
        <div class="co-label">Icon</div>
        <div class="emoji-row">
          ${EMOJIS.map((e) => `<button class="emoji-pick ${f.emoji === e ? 'active' : ''}" data-npemoji="${e}">${e}</button>`).join('')}
        </div>
        <button class="admin-btn" style="margin-top:10px" data-add-product>Add to menu</button>
        ${this._formMsg ? `<div class="form-msg">${esc(this._formMsg)}</div>` : ''}
      </div>
      ${menu.map((m) => `
        <div class="menu-row">
          <div class="thumb" style="background:${m.tint}"><span style="font-size:28px">${m.emoji}</span></div>
          <div style="flex:1">
            <div class="card-name">${esc(m.name)}</div>
            <div class="card-price">${m.category}${m.available ? '' : ' • Sold out'}</div>
            ${this._editingId === m.id ? `
              <div class="form-row">
                <input class="admin-input" id="price-draft" type="text" inputmode="decimal"
                      placeholder="0.00" value="${esc(this._priceDraft)}" style="width:100px">
                <button class="admin-btn" data-save-price="${m.id}">Save</button>
                <button class="admin-btn ghost" data-cancel-price>Cancel</button>
              </div>
              ${this._priceErr ? `<div class="field-error">${esc(this._priceErr)}</div>` : ''}`
            : `<div class="card-price" style="font-size:14px;font-weight:800;color:inherit">${peso(m.price)}</div>`}
          </div>
          ${this._editingId !== m.id ? `
            <button class="admin-btn" data-edit-price="${m.id}">✏️ Price</button>
            <button class="admin-btn danger" data-remove="${m.id}">Remove</button>` : ''}
        </div>`).join('')}
      ${this._pendingRemove ? `
        <div class="modal-dim show">
          <div class="modal-card">
            <div class="modal-title">Remove product?</div>
            <div class="modal-sub">“${esc(this._pendingRemove.name)}” will no longer appear on the POS. Past orders keep their records.</div>
            <div class="modal-btns">
              <button class="admin-btn ghost" data-cancel-remove>Cancel</button>
              <button class="admin-btn danger" data-confirm-remove="${this._pendingRemove.id}">Remove</button>
            </div>
          </div>
        </div>` : ''}`;
  }

  _pinMarkup() {
    return `
      <div class="add-form" style="max-width:520px">
        <div class="add-form-title">Change admin PIN</div>
        <div class="view-sub">Anyone with the PIN can edit photos, prices and products — keep it secret.</div>
        <div class="form-row">
          <div style="flex:1">
            <div class="co-label">Current</div>
            <input class="admin-input" id="pin-current" type="password" inputmode="numeric"
                   placeholder="••••" value="${esc(this._pinForm.current)}" style="width:100%">
          </div>
          <div style="flex:1">
            <div class="co-label">New (4–8 digits)</div>
            <input class="admin-input" id="pin-next" type="password" inputmode="numeric"
                   placeholder="••••" value="${esc(this._pinForm.next)}" style="width:100%">
          </div>
          <button class="admin-btn" data-change-pin>Save</button>
        </div>
        ${this._pinMsg ? `<div class="form-msg">${esc(this._pinMsg)}</div>` : ''}
      </div>`;
  }

  /* -------- handler registration (controller subscribes) -------- */
  addHandlerKey(h) { this._key = h; }
  addHandlerBackspace(h) { this._backspace = h; }
  addHandlerUnlock(h) { this._unlock = h; }
  addHandlerLock(h) { this._lock = h; }
  addHandlerSection(h) { this._section = h; }
  addHandlerAddItem(h) { this._addItem = h; }
  addHandlerEditPrice(h) { this._editPrice = h; }
  addHandlerRemove(h) { this._remove = h; }
  addHandlerPhoto(h) { this._photo = h; }
  addHandlerRemovePhoto(h) { this._removePhoto = h; }
  addHandlerChangePin(h) { this._changePin = h; }

  /* -------- controller-driven view state -------- */
  // Render the PIN gate with an error (after a failed unlock).
  setPinError(msg) { this._pinError = msg; }
  // Read the add-product form drafts (controller validates).
  get form() { return { ...this._form }; }
  // Show the add-product form message (validation / success).
  setFormMsg(msg) { this._formMsg = msg; }
  // Enter inline price edit mode for one product.
  startPriceEdit(id, currentPrice) {
    this._editingId = id;
    this._priceDraft = String(currentPrice);
    this._priceErr = '';
  }
  get priceDraft() { return this._priceDraft; }
  setPriceErr(msg) { this._priceErr = msg; }
  cancelPriceEdit() { this._editingId = null; this._priceErr = ''; }
  // Remove-confirm modal.
  askRemove(id, name) { this._pendingRemove = { id, name }; }
  dismissRemove() { this._pendingRemove = null; }
  // PIN change form.
  get pinForm() { return { ...this._pinForm }; }
  setPinMsg(msg) { this._pinMsg = msg; }

  // Keep the PIN pad responsive: digits feed the pad directly, and the
  // controller validates on unlock.
  pressKey(k) {
    if (k === '⌫') return this._backspace();
    return this._key(k);
  }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('[data-key]').forEach((b) =>
      b.addEventListener('click', () => self.pressKey(b.dataset.key)));
    const unlock = this._parentEl.querySelector('[data-unlock]');
    if (unlock) unlock.addEventListener('click', () => self._unlock());
    const lock = this._parentEl.querySelector('[data-lock]');
    if (lock) lock.addEventListener('click', () => self._lock());
    this._parentEl.querySelectorAll('[data-section]').forEach((b) =>
      b.addEventListener('click', () => self._section(b.dataset.section)));

    // add-product form (drafts live in this view until the controller
    // validates and adds the item through the model)
    const name = this._parentEl.querySelector('#np-name');
    if (name) name.addEventListener('input', () => { self._form.name = name.value; self._formMsg = ''; });
    const price = this._parentEl.querySelector('#np-price');
    if (price) price.addEventListener('input', () => { self._form.price = price.value.replace(/[^0-9.]/g, ''); self._formMsg = ''; });
    this._parentEl.querySelectorAll('[data-npcat]').forEach((b) =>
      b.addEventListener('click', () => { self._form.category = b.dataset.npcat; self.render(self._data); }));
    this._parentEl.querySelectorAll('[data-npemoji]').forEach((b) =>
      b.addEventListener('click', () => { self._form.emoji = b.dataset.npemoji; self.render(self._data); }));
    const addBtn = this._parentEl.querySelector('[data-add-product]');
    if (addBtn) addBtn.addEventListener('click', () => self._addItem(self.form));

    // inline price editor
    this._parentEl.querySelectorAll('[data-edit-price]').forEach((b) =>
      b.addEventListener('click', () => self._editPrice(b.dataset.editPrice)));
    const draft = this._parentEl.querySelector('#price-draft');
    if (draft) draft.addEventListener('input', () => { self._priceDraft = draft.value.replace(/[^0-9.]/g, ''); });
    const savePrice = this._parentEl.querySelector('[data-save-price]');
    if (savePrice) savePrice.addEventListener('click', () => self._editPrice(self._editingId, self._priceDraft, true));
    const cancelPrice = this._parentEl.querySelector('[data-cancel-price]');
    if (cancelPrice) cancelPrice.addEventListener('click', () => { self.cancelPriceEdit(); self.render(self._data); });

    // remove modal
    this._parentEl.querySelectorAll('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => self._remove(b.dataset.remove)));
    const confirmRemove = this._parentEl.querySelector('[data-confirm-remove]');
    if (confirmRemove) confirmRemove.addEventListener('click', () => self._remove(confirmRemove.dataset.confirmRemove, true));
    const cancelRemove = this._parentEl.querySelector('[data-cancel-remove]');
    if (cancelRemove) cancelRemove.addEventListener('click', () => { self.dismissRemove(); self.render(self._data); });

    // photo uploads / removal
    this._parentEl.querySelectorAll('input[data-photo]').forEach((input) =>
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) self._photo(input.dataset.photo, file);
      }));
    this._parentEl.querySelectorAll('[data-remove-photo]').forEach((b) =>
      b.addEventListener('click', () => self._removePhoto(b.dataset.removePhoto)));

    // PIN change form
    const cur = this._parentEl.querySelector('#pin-current');
    if (cur) cur.addEventListener('input', () => { self._pinForm.current = cur.value.replace(/[^0-9]/g, '').slice(0, 8); });
    const nxt = this._parentEl.querySelector('#pin-next');
    if (nxt) nxt.addEventListener('input', () => { self._pinForm.next = nxt.value.replace(/[^0-9]/g, '').slice(0, 8); });
    const changePin = this._parentEl.querySelector('[data-change-pin]');
    if (changePin) changePin.addEventListener('click', () => self._changePin(self.pinForm.current, self.pinForm.next));
  }
}
