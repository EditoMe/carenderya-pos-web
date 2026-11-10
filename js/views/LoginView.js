// LoginView — owner/staff login and account creation (Gmail).
// Renders into <section class="login-view">.
// Handlers:
//   addHandlerMode(mode)        — 'login' | 'create'
//   addHandlerRole(role)        — 'owner' | 'staff' (create form)
//   addHandlerField(field,val)  — name,email,password
//   addHandlerSubmit()          — login or create depending on mode
import { View, esc } from './View.js';

export class LoginView extends View {
  _generateMarkup() {
    const { mode, role, name, email, password, error, success } = this._data;
    const isCreate = mode === 'create';

    return `
      <div class="login-card">
        <div class="login-brand">🍲</div>
        <div class="view-title" style="text-align:center">Carenderya POS</div>
        <div class="view-sub" style="text-align:center">Owner or staff — sign in with your Gmail account</div>

        <div class="seg" style="margin:12px auto 10px; width:max-content">
          <button class="seg-btn ${!isCreate ? 'active' : ''}" data-mode="login">Login</button>
          <button class="seg-btn ${isCreate ? 'active' : ''}" data-mode="create">Create Account</button>
        </div>

        ${isCreate ? `
          <div class="co-label">Role</div>
          <div class="methods" style="margin-bottom:8px">
            <button class="method ${role === 'owner' ? 'active' : ''}" data-role="owner">Owner</button>
            <button class="method ${role === 'staff' ? 'active' : ''}" data-role="staff">Staff</button>
          </div>

          <div class="co-label">Full name</div>
          <input class="admin-input" id="login-name" type="text" placeholder="e.g. Juan Dela Cruz" value="${esc(name || '')}" style="width:100%;margin-bottom:8px">

          <div class="co-label">Gmail address</div>
          <input class="admin-input" id="login-email" type="email" inputmode="email" placeholder="name@gmail.com" value="${esc(email || '')}" style="width:100%;margin-bottom:8px">

          <div class="co-label">Password</div>
          <input class="admin-input" id="login-password" type="password" placeholder="At least 4 characters" value="${esc(password || '')}" style="width:100%">
          <div class="pin-hint" style="margin-top:6px">Use your Gmail address to create and remember this account on this device.</div>
        ` : `
          <div class="co-label">Gmail address</div>
          <input class="admin-input" id="login-email" type="email" inputmode="email" placeholder="name@gmail.com" value="${esc(email || '')}" style="width:100%;margin-bottom:8px">

          <div class="co-label">Password</div>
          <input class="admin-input" id="login-password" type="password" placeholder="Your password" value="${esc(password || '')}" style="width:100%">
          <div class="pin-hint" style="margin-top:6px">Login with the Gmail account you created (owner or staff).</div>
        `}

        <div class="form-error ${error ? 'show' : ''}" style="margin-top:10px">${esc(error || '')}</div>
        ${success ? `<div class="form-msg" style="color:#2e9e4f;margin-top:8px">${esc(success)}</div>` : ''}

        <button class="confirm-btn" data-submit style="margin-top:12px">${isCreate ? 'Create Account' : 'Login'}</button>
      </div>`;
  }

  addHandlerMode(h) { this._mode = h; }
  addHandlerRole(h) { this._role = h; }
  addHandlerField(h) { this._field = h; }
  addHandlerSubmit(h) { this._submit = h; }

  _bindHandlers() {
    const self = this;
    this._parentEl.querySelectorAll('[data-mode]').forEach((b) =>
      b.addEventListener('click', () => self._mode(b.dataset.mode)));
    this._parentEl.querySelectorAll('[data-role]').forEach((b) =>
      b.addEventListener('click', () => self._role(b.dataset.role)));

    const name = this._parentEl.querySelector('#login-name');
    if (name) name.addEventListener('input', () => self._field('name', name.value));
    const email = this._parentEl.querySelector('#login-email');
    if (email) email.addEventListener('input', () => self._field('email', email.value));
    const pass = this._parentEl.querySelector('#login-password');
    if (pass) pass.addEventListener('input', () => self._field('password', pass.value));

    const submit = this._parentEl.querySelector('[data-submit]');
    if (submit) submit.addEventListener('click', () => self._submit());
  }
}
