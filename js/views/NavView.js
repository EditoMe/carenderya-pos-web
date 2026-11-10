// NavView — left navigation rail. Owner: Member 1
// Renders into <nav class="rail">. Exposes addHandlerNavigate(view).
import { View } from './View.js';

export class NavView extends View {
  _generateMarkup() {
    const user = this._data?.user;
    const items = [
      { view: 'pos', icon: '🧾', label: 'POS' },
      { view: 'orders', icon: '🍳', label: 'Orders' },
      { view: 'history', icon: '📊', label: 'Sales' },
      { view: 'menu', icon: '🍽️', label: 'Menu' },
      ...(user?.role === 'owner' ? [{ view: 'admin', icon: '🔐', label: 'Admin' }] : []),
    ];
    const active = this._data?.view ?? 'pos';
    const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
    const title = user?.email ? `${user.name || ''} (${user.email})` : (user?.name || '');
    return `
      <div class="rail-logo">🍲</div>
      ${items.map((it) => `
        <button class="rail-btn ${active === it.view ? 'active' : ''}" data-view="${it.view}">
          <span class="icon">${it.icon}</span>
          <span class="lbl">${it.label}</span>
        </button>`).join('')}
      <div class="rail-spacer"></div>
      ${user ? `
        <button class="rail-btn" data-logout title="Logout ${user.role || ''}">
          <span class="icon">⎋</span>
          <span class="lbl">Logout</span>
        </button>` : ''}
      <div class="rail-avatar" title="${title}">${initial}</div>`;
  }

  addHandlerNavigate(handler) {
    this._navigate = handler;
  }
  addHandlerLogout(handler) {
    this._logout = handler;
  }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('.rail-btn[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => self._navigate(btn.dataset.view));
    });
    const logout = this._parentEl.querySelector('[data-logout]');
    if (logout && self._logout) logout.addEventListener('click', () => self._logout());
  }
}
