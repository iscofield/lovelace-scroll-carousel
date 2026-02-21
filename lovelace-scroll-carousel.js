/**
 * lovelace-scroll-carousel
 * A horizontally scrollable infinite-scroll carousel card for Home Assistant Lovelace.
 *
 * @license MIT
 * @see https://github.com/iscofield/lovelace-scroll-carousel
 */

// TODO: Implement based on docs/specs/2026-02-19-scroll-carousel-card.md

class LovelaceScrollCarousel extends HTMLElement {
  static getConfigElement() {
    // TODO: Return visual editor element if implemented
    return document.createElement('lovelace-scroll-carousel-editor');
  }

  static getStubConfig() {
    return {
      card_width: 300,
      card_spacing: 8,
      cards: [],
    };
  }

  constructor() {
    super();
    // TODO: Implement constructor
  }

  setConfig(config) {
    if (!config.card_width) {
      throw new Error('card_width is required');
    }
    if (!config.cards || !Array.isArray(config.cards) || config.cards.length === 0) {
      throw new Error('cards must be a non-empty array');
    }
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    // TODO: Propagate hass to child cards and clones
  }

  connectedCallback() {
    // TODO: Implement
  }

  disconnectedCallback() {
    // TODO: Implement cleanup
  }

  getCardSize() {
    // Return a reasonable default; will be refined after config is available
    return 3;
  }
}

customElements.define('lovelace-scroll-carousel', LovelaceScrollCarousel);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lovelace-scroll-carousel',
  name: 'Lovelace Scroll Carousel',
  description: 'A horizontally scrollable infinite-scroll carousel for Lovelace.',
  preview: false,
  documentationURL: 'https://github.com/iscofield/lovelace-scroll-carousel',
});
