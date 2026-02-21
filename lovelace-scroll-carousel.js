/**
 * lovelace-scroll-carousel
 * A horizontally scrollable carousel card for Home Assistant Lovelace.
 *
 * @license MIT
 * @see https://github.com/iscofield/lovelace-scroll-carousel
 */

if (!customElements.get('lovelace-scroll-carousel')) {

class LovelaceScrollCarousel extends HTMLElement {

  // ─── Platform API ──────────────────────────────────────────────────────────

  static getStubConfig() {
    return {
      card_width: 300,
      card_spacing: 8,
      start_position: 'right',
      cards: [],
    };
  }

  static getGridOptions() {
    return { min_rows: 1, min_columns: 1 };
  }

  static getConfigElement() {
    // No visual editor — return undefined to signal not available
    return undefined;
  }

  // ─── Constructor ───────────────────────────────────────────────────────────

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._abortController = new AbortController();
    this._cardsCreated = false;
    this._childCards = null;
    this._config = null;
    this._configGeneration = 0;
    this._container = null;
    this._helpers = null;
    this._hass = null;
    this._pendingResizeRAF = false;
    this._reducedMotionMQL = null;
    this._resizeObserver = null;
    this._startPositionRAF = null;
    this._userHasScrolled = false;
  }

  // ─── Configuration ─────────────────────────────────────────────────────────

  setConfig(config) {
    if (!config.cards) {
      throw new Error('lovelace-scroll-carousel: "cards" configuration key is required');
    }
    if (!Array.isArray(config.cards)) {
      throw new Error('lovelace-scroll-carousel: "cards" must be an array');
    }
    if (config.cards.length === 0) {
      throw new Error('lovelace-scroll-carousel: "cards" array must not be empty');
    }

    // card_width: number >= 20, default 100
    const rawWidth = config.card_width ?? 100;
    const cardWidth = (Number.isFinite(rawWidth) && Math.round(rawWidth) >= 20)
      ? Math.round(rawWidth) : 100;

    // card_spacing: number >= 0, default 8
    const rawSpacing = config.card_spacing ?? 8;
    const cardSpacing = (Number.isFinite(rawSpacing) && Math.round(rawSpacing) >= 0)
      ? Math.round(rawSpacing) : 8;

    // start_position: 'left' | 'right' | integer pixel offset
    let startPos = config.start_position ?? 'right';
    if (typeof startPos === 'number') {
      startPos = Number.isFinite(startPos) ? Math.round(startPos) : 'right';
    } else if (typeof startPos === 'string') {
      if (startPos !== 'left' && startPos !== 'right') {
        const parsed = parseInt(startPos, 10);
        startPos = Number.isNaN(parsed) ? 'right' : parsed;
      }
    } else {
      startPos = 'right';
    }

    // card_height: CSS value string or 'auto'
    const CARD_HEIGHT_RE = /^(\d+(\.\d+)?(px|em|rem|%|vh|dvh|svh|lvh|vw|dvw|svw|lvw|vmin|vmax|dvmin|dvmax|svmin|svmax|lvmin|lvmax|ch|ex|lh|cqw|cqh)|auto|fit-content|max-content|min-content)$/;
    const rawHeight = (typeof config.card_height === 'string') ? config.card_height : 'auto';
    const cardHeight = CARD_HEIGHT_RE.test(rawHeight) ? rawHeight : 'auto';

    // aria_label: string, default 'Card carousel'
    const ariaLabel = (typeof config.aria_label === 'string' && config.aria_label.trim() !== '')
      ? config.aria_label.trim() : 'Card carousel';

    // infinite: boolean, default false
    const infinite = (typeof config.infinite === 'boolean') ? config.infinite : false;
    if (infinite) {
      // Infinite scroll not yet implemented — log and fall back to non-infinite
      console.warn('lovelace-scroll-carousel: infinite scroll is not yet implemented; using infinite: false');
    }

    this._config = {
      card_width: cardWidth,
      card_spacing: cardSpacing,
      card_height: cardHeight,
      start_position: startPos,
      infinite: false,  // Always non-infinite in this version
      aria_label: ariaLabel,
      cards: config.cards,
    };

    this._configGeneration = (this._configGeneration || 0) + 1;
    this._cardsCreated = false;
    this._cleanup();
    this._loadCards(this._configGeneration);
  }

  // ─── hass propagation ──────────────────────────────────────────────────────

  set hass(hass) {
    this._hass = hass;
    if (this._childCards) {
      for (const card of this._childCards) {
        card.hass = hass;
      }
    }
  }

  // ─── Card size hint ────────────────────────────────────────────────────────

  getCardSize() {
    if (!this._config) return 3;
    const h = this._config.card_height;
    if (!h || h === 'auto') return 3;
    const pxMatch = h.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) return Math.max(1, Math.ceil(parseFloat(pxMatch[1]) / 50));
    return 3;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    // Create a fresh AbortController so event listeners added in _render() are live
    this._abortController = new AbortController();
    if (this._config && this._cardsCreated && this._childCards) {
      this._render();
    }
  }

  disconnectedCallback() {
    // Abort all listeners but do not reset user interaction state or create a
    // new AbortController — connectedCallback handles that on next attach.
    if (this._abortController) {
      this._abortController.abort();
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._startPositionRAF !== null) {
      cancelAnimationFrame(this._startPositionRAF);
      this._startPositionRAF = null;
    }
    this._pendingResizeRAF = false;
    this._container = null;
  }

  // ─── Cleanup (called from setConfig) ───────────────────────────────────────

  _cleanup() {
    // Abort existing listeners
    if (this._abortController) {
      this._abortController.abort();
    }
    // Create fresh controller for subsequent render
    this._abortController = new AbortController();

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._startPositionRAF !== null) {
      cancelAnimationFrame(this._startPositionRAF);
      this._startPositionRAF = null;
    }
    this._pendingResizeRAF = false;
    this._userHasScrolled = false;
    this._container = null;

    // Clear shadow DOM
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }
  }

  // ─── Card loading ──────────────────────────────────────────────────────────

  async _loadCards(generation) {
    if (!this._helpers) {
      try {
        this._helpers = await window.loadCardHelpers();
      } catch (e) {
        if (generation !== this._configGeneration) return;
        this._renderError(`lovelace-scroll-carousel: Failed to load card helpers: ${e.message}`);
        return;
      }
    }
    if (generation !== this._configGeneration) return;
    this._createCards(generation);
  }

  _renderError(message) {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = '';
    try {
      const alert = document.createElement('ha-alert');
      alert.alertType = 'error';
      alert.innerText = message;
      this.shadowRoot.appendChild(alert);
    } catch {
      const p = document.createElement('p');
      p.textContent = message;
      p.style.cssText = 'color:red;padding:8px;';
      this.shadowRoot.appendChild(p);
    }
  }

  _createCards(generation) {
    // Synchronous guard — no awaits between check and set, so this is race-free
    if (this._cardsCreated) return;
    this._cardsCreated = true;

    const cards = [];
    for (const cardConfig of this._config.cards) {
      try {
        const card = this._helpers.createCardElement(cardConfig);
        if (this._hass) card.hass = this._hass;
        cards.push(card);
      } catch (e) {
        // Create an error placeholder for this card slot
        try {
          const errCard = document.createElement('hui-error-card');
          errCard.setConfig({ type: 'error', error: String(e.message), origConfig: cardConfig });
          cards.push(errCard);
        } catch {
          // If even that fails, create a minimal div placeholder
          const div = document.createElement('div');
          div.style.cssText = 'padding:8px;color:red;font-size:12px;';
          div.textContent = `Card error: ${e.message}`;
          cards.push(div);
        }
      }
    }

    this._childCards = cards;

    if (generation !== this._configGeneration) return;
    if (this.isConnected) {
      this._render();
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  _render() {
    if (!this._config || !this._childCards) return;

    // Reset user interaction flag on full re-render
    this._userHasScrolled = false;

    // Build shadow DOM from scratch
    this.shadowRoot.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `
      :host { display: block; }
      .scroll-container {
        display: flex;
        align-items: stretch;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-x: contain;
        scrollbar-width: none;
        gap: var(--card-spacing, 8px);
      }
      .scroll-container::-webkit-scrollbar { display: none; }
      .card-wrapper {
        flex-shrink: 0;
        width: var(--card-width, 100px);
        min-height: var(--card-height, auto);
      }
      .card-wrapper > * { width: 100%; height: 100%; }
    `;

    const container = document.createElement('div');
    container.className = 'scroll-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', this._config.aria_label);
    container.setAttribute('tabindex', '0');
    container.style.setProperty('--card-width', `${this._config.card_width}px`);
    container.style.setProperty('--card-spacing', `${this._config.card_spacing}px`);
    container.style.setProperty('--card-height', this._config.card_height);

    const totalCards = this._childCards.length;
    for (let i = 0; i < totalCards; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-label', `Item ${i + 1} of ${totalCards}`);
      wrapper.appendChild(this._childCards[i]);
      container.appendChild(wrapper);
    }

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
    this._container = container;

    // Cache reduced motion preference
    this._reducedMotionMQL = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial scroll position after first paint
    this._startPositionRAF = requestAnimationFrame(() => {
      this._startPositionRAF = null;
      this._setStartPosition();
    });

    // Set up observers and interaction tracking
    this._setupResizeObserver();
    this._setupKeyboardNavigation();
    this._setupScrollTracking();
  }

  // ─── Scroll positioning ────────────────────────────────────────────────────

  _setStartPosition() {
    const container = this._container;
    if (!container) return;
    if (this._userHasScrolled) return;

    const pos = this._config.start_position;
    if (pos === 'right') {
      container.scrollLeft = container.scrollWidth - container.clientWidth;
    } else if (pos === 'left') {
      container.scrollLeft = 0;
    } else if (typeof pos === 'number') {
      container.scrollLeft = pos;
    }
  }

  // ─── Resize observer ───────────────────────────────────────────────────────

  _setupResizeObserver() {
    if (!this._container) return;

    this._resizeObserver = new ResizeObserver(() => {
      // Debounce via rAF to avoid forced synchronous layout
      if (this._pendingResizeRAF) return;
      this._pendingResizeRAF = true;
      requestAnimationFrame(() => {
        this._pendingResizeRAF = false;
        // Only re-apply start position if the user has not yet scrolled
        if (!this._userHasScrolled) {
          this._setStartPosition();
        }
      });
    });
    this._resizeObserver.observe(this._container);
  }

  // ─── User scroll tracking ──────────────────────────────────────────────────

  _setupScrollTracking() {
    if (!this._container) return;
    const signal = this._abortController.signal;

    const markScrolled = (e) => {
      // Only mark when the event originates on the container itself
      if (e.target !== this._container) return;
      this._userHasScrolled = true;
    };

    this._container.addEventListener('pointerdown', markScrolled, { signal });
    this._container.addEventListener('wheel', markScrolled, { signal, passive: true });
  }

  // ─── Keyboard navigation ───────────────────────────────────────────────────

  _setupKeyboardNavigation() {
    if (!this._container) return;
    const signal = this._abortController.signal;

    this._container.addEventListener('keydown', (e) => {
      // Only handle keyboard events when the scroll container itself has focus,
      // not when focus is within a child card.
      if (e.target !== this._container) return;

      const container = this._container;
      const scrollAmount = this._config.card_width + this._config.card_spacing;
      // Use 'smooth' scrolling in non-infinite mode; fall back to 'instant' for
      // users who prefer reduced motion (respects OS/browser accessibility setting).
      const prefersReducedMotion = this._reducedMotionMQL && this._reducedMotionMQL.matches;
      const behavior = prefersReducedMotion ? 'instant' : 'smooth';

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this._userHasScrolled = true;
        container.scrollBy({ left: scrollAmount, behavior });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this._userHasScrolled = true;
        container.scrollBy({ left: -scrollAmount, behavior });
      } else if (e.key === 'Home') {
        e.preventDefault();
        this._userHasScrolled = true;
        container.scrollTo({ left: 0, behavior });
      } else if (e.key === 'End') {
        e.preventDefault();
        this._userHasScrolled = true;
        container.scrollTo({ left: container.scrollWidth - container.clientWidth, behavior });
      }
    }, { signal });
  }

}

customElements.define('lovelace-scroll-carousel', LovelaceScrollCarousel);

} // end if (!customElements.get(...))

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'lovelace-scroll-carousel')) {
  window.customCards.push({
    type: 'lovelace-scroll-carousel',
    name: 'Lovelace Scroll Carousel',
    description: 'A horizontally scrollable carousel for Lovelace.',
    preview: false,
    documentationURL: 'https://github.com/iscofield/lovelace-scroll-carousel',
  });
}
