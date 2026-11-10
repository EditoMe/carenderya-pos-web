// Carenderya POS — Base View class (js/views/View.js)
// Owner: Member 1 (base class shared by every member's views)
//
// A View renders into ONE parent element. How it works:
//   1. The controller constructs the view with its parent element.
//   2. The controller subscribes handler functions (addHandlerXxx).
//   3. The controller calls view.render(data) whenever state changes.
// A View NEVER imports the model and NEVER builds markup with inline
// onclick — it only returns an HTML string for the controller to display
// and stores the handler callbacks it was given. This mirrors the
// base View class from the course (Week 5).

export class View {
  constructor(parentEl) {
    this._parentEl = parentEl;
    this._data = null;
  }

  // Every subclass overrides this to produce its markup.
  _generateMarkup() {
    return '';
  }

  // Same entry point as the course's base View: render(data) rebuilds
  // the parent element's HTML from the data it is given.
  // Preserves focus/caret for the active input inside this view so
  // typing doesn't force a click after every character.
  render(data) {
    const active = document.activeElement;
    const restoreId =
      active && active.id && this._parentEl.contains(active) ? active.id : null;
    const selStart = active?.selectionStart;
    const selEnd = active?.selectionEnd;

    this._data = data;
    this._parentEl.innerHTML = this._generateMarkup();
    this._bindHandlers();

    if (restoreId) {
      const el = this._parentEl.querySelector('#' + CSS.escape(restoreId));
      if (el && typeof el.focus === 'function') {
        el.focus();
        if (typeof selStart === 'number' && typeof el.setSelectionRange === 'function') {
          try { el.setSelectionRange(selStart, selEnd); } catch { /* number/date inputs */ }
        }
      }
    }
  }

  // Hook for subclasses: attach the controller-supplied handler methods
  // to the freshly-built DOM. No-op in the base class.
  _bindHandlers() {}

  // Read the current products the controller has rendered (test helper).
  get products() {
    return this._data;
  }
}

// Shared string helpers used by several views.
export const peso = (n) =>
  `₱${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

// Image priority: owner photo (data URL) → bundled Figma photo → emoji.
export const imgTag = (item, ownerPhoto) => {
  const src = ownerPhoto || item.photo;
  if (src) {
    return `<img src="${src}" alt="${esc(item.name)}" onerror="this.outerHTML='<span class=emoji>${item.emoji}</span>'">`;
  }
  return `<span class="emoji">${item.emoji}</span>`;
};
