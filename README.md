# Lovelace Scroll Carousel

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/YOUR_USERNAME/lovelace-scroll-carousel.svg)](https://github.com/YOUR_USERNAME/lovelace-scroll-carousel/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Home Assistant Lovelace card that renders child cards in a **freely scrollable, infinite-scroll horizontal carousel** — using native browser scrolling instead of CSS transforms. Supports touch swipe, mouse drag, scroll wheel, and full keyboard navigation. Wraps around seamlessly so you never hit a hard edge.

---

<!-- Add a demo GIF here once implemented -->
<!-- ![Demo](demo.gif) -->

## Why This Card?

Existing HACS carousel cards (`simple-swipe-card`, `swipe-card`) use `transform: translateX()` with index-based positioning. This means:

- **No pixel-precise start position** — you can only start at a card boundary, never partway through
- **No free scrolling** — always snaps to a card, can't stop mid-swipe
- **No native momentum** — custom animation instead of the browser's built-in scroll physics

`lovelace-scroll-carousel` uses `overflow-x: auto` natively. The browser handles momentum, touch physics, and scroll behavior — the card just provides the layout and infinite-scroll logic.

## Features

- **Native scrolling** — pixel-precise positioning, natural momentum on touch/trackpad, no snap-to
- **Infinite scroll** — seamlessly wraps from last card back to first (and vice versa) via clone-based repositioning
- **Configurable start position** — show the leftmost card, rightmost card, or any pixel offset on load
- **Touch, mouse, and keyboard navigation** — swipe, click-drag, scroll wheel, arrow keys, Home/End
- **Auto-play** — optional automatic advance with configurable interval
- **Any child card** — works with tile, statistics, apexcharts, button-card, markdown, and more
- **Respects `prefers-reduced-motion`** — disables smooth scroll transitions for users who prefer it
- **WCAG 2.1 AA accessible** — WAI-ARIA APG Carousel pattern, screen reader position announcements
- **No external dependencies** — single vanilla JS file, ~XX KB

## Installation

### HACS (Recommended)

1. Open **HACS** in Home Assistant
2. Go to **Frontend** → click the **⋮ menu** → **Custom repositories**
3. Add `https://github.com/YOUR_USERNAME/lovelace-scroll-carousel` as type **Lovelace**
4. Find **Lovelace Scroll Carousel** in the HACS Frontend store and install it
5. **Hard-refresh** your browser (Ctrl+Shift+R / Cmd+Shift+R)

### Manual

1. Download `lovelace-scroll-carousel.js` from the [latest release](https://github.com/YOUR_USERNAME/lovelace-scroll-carousel/releases/latest)
2. Copy it to `config/www/lovelace-scroll-carousel.js`
3. Add a resource in your dashboard settings (or in `configuration.yaml`):

```yaml
lovelace:
  resources:
    - url: /local/lovelace-scroll-carousel.js
      type: module
```

4. Refresh your browser

## Configuration

```yaml
type: custom:lovelace-scroll-carousel
card_width: 300
cards:
  - type: tile
    entity: sensor.solar_house_total_power
  - type: tile
    entity: sensor.solar_house_net_grid
  - type: tile
    entity: sensor.solar_self_sufficiency
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cards` | list | **required** | List of Lovelace card configurations |
| `card_width` | number | `100` | Width of each card in pixels (min: 20) |
| `card_spacing` | number | `8` | Gap between cards in pixels |
| `card_height` | string | `auto` | Height of cards — any valid CSS value (`200px`, `50vh`, `auto`, etc.) |
| `start_position` | string \| number | `right` | Initial scroll position: `left`, `right`, or a pixel offset |
| `infinite` | boolean | `true` | Enable infinite wrap-around scrolling |
| `auto_play` | boolean | `false` | Automatically advance to the next card |
| `auto_play_interval` | number | `5000` | Auto-advance interval in milliseconds |

### `card_height` Supported CSS Values

`px`, `em`, `rem`, `%`, `vh`/`dvh`/`svh`/`lvh`, `vw`/`dvw`/`svw`/`lvw`, `vmin`/`vmax` (and `dv`/`sv`/`lv` variants), `ch`, `ex`, `lh`, `cqw`, `cqh`, `auto`, `fit-content`, `max-content`, `min-content`.

> CSS functions (`calc()`, `min()`, `max()`, `clamp()`, `var()`) are not supported — use a concrete value.

## Examples

### Show Latest Card on Load

Display a scrollable history panel with the most recent entry visible on the right:

```yaml
type: custom:lovelace-scroll-carousel
card_width: 160
card_height: 120px
start_position: right   # newest card is visible on load
cards:
  - type: statistic
    entity: sensor.solar_house_energy_today
    period: day
    stat_type: change
    name: "Mon"
  # ... more cards
```

### Auto-Play Highlight Reel

Cycle through key metrics automatically:

```yaml
type: custom:lovelace-scroll-carousel
card_width: 280
card_height: 180px
start_position: left
auto_play: true
auto_play_interval: 4000
cards:
  - type: tile
    entity: sensor.solar_house_total_power
    name: Solar Output
  - type: tile
    entity: sensor.solar_self_sufficiency
    name: Self-Sufficiency
  - type: tile
    entity: sensor.solar_savings_today
    name: Savings Today
```

### Fixed Pixel Start Position

Start scrolled 400 px in:

```yaml
type: custom:lovelace-scroll-carousel
card_width: 200
start_position: 400
cards: [...]
```

## Keyboard Navigation

When the carousel has focus:

| Key | Action |
|-----|--------|
| `←` / `→` | Scroll left / right by one card width |
| `Home` | Jump to the first card |
| `End` | Jump to the last card |
| `Tab` | Move focus out of the carousel |

## Accessibility

- Follows the [WAI-ARIA APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
- `aria-roledescription="carousel"` on the container
- Each card slide has `aria-roledescription="slide"` and `aria-label="Card N of M"`
- Screen reader announces position when navigating with arrow keys
- Clone elements (used for infinite scroll) are `aria-hidden="true"` and `role="presentation"`
- `prefers-reduced-motion` disables smooth scroll transitions

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Samsung Internet | 14+ |

Requires Home Assistant **0.107** or later (for `loadCardHelpers()`).

## Contributing

Pull requests are welcome! Please open an issue first to discuss significant changes.

```bash
git clone https://github.com/YOUR_USERNAME/lovelace-scroll-carousel
# Edit lovelace-scroll-carousel.js
# Test in Home Assistant developer mode
```

## License

MIT — see [LICENSE](LICENSE)
