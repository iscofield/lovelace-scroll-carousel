# Lovelace Scroll Carousel

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

A horizontally scrollable carousel card for Home Assistant Lovelace dashboards. Supports infinite scroll (wraps around seamlessly), touch/mouse/keyboard navigation, and any number of child cards.

## Features

- Smooth horizontal scrolling with infinite wrap-around
- Touch swipe, mouse drag, and scroll wheel support
- Keyboard navigation (Arrow keys, Home, End)
- Configurable card size, spacing, and starting position
- Auto-play with configurable interval
- Respects `prefers-reduced-motion`
- WCAG 2.1 AA accessible (WAI-ARIA APG Carousel pattern)
- No external dependencies — pure vanilla JS

## Installation

### HACS (recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend** → **Custom repositories**
3. Add `https://github.com/YOUR_USERNAME/lovelace-scroll-carousel` as type **Lovelace**
4. Install **Lovelace Scroll Carousel**
5. Refresh your browser

### Manual

Download `lovelace-scroll-carousel.js` and place it in your `config/www/` folder, then add to your Lovelace resources:

```yaml
resources:
  - url: /local/lovelace-scroll-carousel.js
    type: module
```

## Configuration

```yaml
type: custom:lovelace-scroll-carousel
card_width: 300          # px — width of each card (required)
card_spacing: 8          # px — gap between cards (default: 8)
card_height: 200px       # CSS value — height of the carousel (default: auto)
start_position: first    # first | last | center (default: first)
auto_play: false         # boolean — enable auto-advance (default: false)
auto_play_interval: 5000 # ms — auto-advance interval (default: 5000)
cards:
  - type: tile
    entity: sensor.solar_house_total_power
  - type: tile
    entity: sensor.solar_house_net_grid
  - type: tile
    entity: sensor.solar_self_sufficiency
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `card_width` | number | — | **Required.** Width of each card in pixels |
| `card_spacing` | number | `8` | Gap between cards in pixels |
| `card_height` | string | `auto` | Height — any valid CSS value (px, %, vh, etc.) |
| `start_position` | string | `first` | Initial scroll position: `first`, `last`, or `center` |
| `auto_play` | boolean | `false` | Enable automatic advance |
| `auto_play_interval` | number | `5000` | Auto-advance interval in milliseconds |
| `cards` | list | — | **Required.** List of card configurations |

## Accessibility

- Full keyboard navigation: Arrow keys scroll, Home/End jump to first/last
- Screen reader support via WAI-ARIA APG Carousel pattern
- Announces current position ("Card N of M")
- Respects `prefers-reduced-motion` — disables smooth scroll transitions

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License

MIT
