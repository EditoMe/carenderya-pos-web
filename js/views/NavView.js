// NavView — left navigation rail. Owner: Member 1
// Renders into <nav class="rail">. Exposes addHandlerNavigate(view).
import { View } from './View.js';

export class NavView extends View {
  _generateMarkup() {
    const items = [
      { view: 'pos', icon: '🧾', label: 'POS' },
      { view: 'orders', icon: '🍳', label: 'Orders' },
      { view: 'history', icon: '📊', label: 'Sales' },
      { view: 'menu', icon: '🍽️', label: 'Menu' },
      { view: 'admin', icon: '🔐', label: 'Admin' },
    ];
    const active = this._data?.view ?? 'pos';
    return `
      <div class="rail-logo">🍲</div>
      ${items.map((it) => `
        <button class="rail-btn ${active === it.view ? 'active' : ''}" data-view="${it.view}">
          <span class="icon">${it.icon}</span>
          <span class="lbl">${it.label}</span>
        </button>`).join('')}
      <div class="rail-spacer"></div>
      <div class="rail-avatar">E</div>`;
  }

  addHandlerNavigate(handler) {
    this._navigate = handler;
  }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('.rail-btn').forEach((btn) => {
      btn.addEventListener('click', () => self._navigate(btn.dataset.view));
    });
  }
}
