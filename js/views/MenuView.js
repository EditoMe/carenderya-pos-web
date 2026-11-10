// MenuView — menu availability toggles. Owner: Member 3
// Renders into <section class="menu-view">. Exposes
// addHandlerToggle(id) for the controller to subscribe.
import { View, peso, esc, imgTag } from './View.js';

export class MenuView extends View {
  _generateMarkup() {
    const { menu, category, categories, search, photos } = this._data;
    const items = menu.filter(
      (m) =>
        (category === 'All Menu' || m.category === category) &&
        m.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
    return `
      <div class="view-title">Menu Management</div>
      <div class="view-sub">Toggle availability — sold-out dishes can't be added to orders</div>
      <div class="cat-row">
        ${categories.map((c) => `
          <button class="pill ${category === c ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
        <input class="search" id="menu-search" type="text" placeholder="Search dishes…" value="${esc(search)}">
      </div>
      ${items.length === 0 ? '<div class="empty">No dishes found.</div>' : ''}
      ${items.map((m) => `
        <div class="menu-row">
          <div class="thumb" style="background:${m.tint}">${imgTag(m, photos[m.id])}</div>
          <div style="flex:1">
            <div class="card-name">${esc(m.name)}</div>
            <div class="card-price">${m.category} • ${peso(m.price)}${m.bestseller ? ' • ★ Bestseller' : ''}</div>
          </div>
          <button class="toggle-btn ${m.available ? 'on' : 'off'}" data-toggle="${m.id}">
            ${m.available ? 'Available' : 'Sold out'}
          </button>
        </div>`).join('')}`;
  }

  addHandlerToggle(h) { this._toggle = h; }
  addHandlerCategory(h) { this._category = h; }
  addHandlerSearch(h) { this._search = h; }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('[data-toggle]').forEach((b) =>
      b.addEventListener('click', () => self._toggle(b.dataset.toggle)));
    this._parentEl.querySelectorAll('.pill').forEach((b) =>
      b.addEventListener('click', () => self._category(b.dataset.cat)));
    const search = this._parentEl.querySelector('#menu-search');
    if (search) {
      search.addEventListener('input', () => self._search(search.value));
    }
  }
}
