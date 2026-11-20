# Service photography drop-in contract

These images are **temporary branded placeholders**. Replace them with licensed service
photography, keeping the **exact filenames** so the app picks them up without code changes.

## Files (one per service)

| File | Service slug |
|---|---|
| `home-clean.jpg` | `home-clean` |
| `deep-clean.jpg` | `deep-clean` |
| `office-clean.jpg` | `office-clean` |
| `move-out-clean.jpg` | `move-out-clean` |

Add a new service by dropping `<slug>.jpg` here and adding one line in
`src/config/service-images.ts`.

## Export requirements

- **Format:** sRGB JPEG or WebP (export as `.jpg` to keep the same filename), progressive.
- **Dimensions:** 1200 × 800 px (3:2). 1600 × 1067 px preferred if the source allows.
- **Size:** target < 300 KB each (these four placeholders total ~116 KB).
- **Rights:** commercial app use, with model/property releases for recognizable people or spaces.

## Composition and safe areas

One image per service is reused everywhere with `contentFit="cover"`, so it is cropped
differently by surface. Keep the main subject **center-weighted** and readable after a
center crop.

| Surface | Rendered size (390 px layout) | Crop / overlay notes |
|---|---|---|
| P7 hero | full width × 250 px tall, parallax | 3:2-ish but the bottom is covered by a dark-green scrim and the title, rating and icon; keep faces/action in the **upper two thirds** and avoid critical detail in the bottom ~35% and very top corners (back/share buttons). |
| Home “Most popular” card | ~173 × 165 px (≈ 1.05:1) | Full-bleed with a dark bottom scrim; white name/price sit on the lower third. |
| Home category rail card | 160 × 92 px (wide strip) | Top photo band only; text sits below the image. |
| P7 related-service card | 200 × 88 px (wide strip) | Top photo band only; text sits below the image. |
| Services list / Search row | 64 × 64 px thumbnail | Nearly square center crop — the subject must still read at small size. |

**Do:** bright, clean scenes; local/Kampala context where possible; a single clear subject.
**Avoid:** visible third-party logos, readable documents, cluttered backgrounds, heavy text
overlays baked into the image, and subjects pushed to the extreme edges.

## API override (heroes today, cards ready)

`GET /services/{slug}` may return `heroImage`, `cardImage` and `areaImage` URL fields. When
present they override the bundled file for the hero, the catalogue/cards, or a specific area
respectively (area wins over card, card wins over bundled). If a remote image fails to load
the app falls back to the bundled file, so the bundled asset remains the safe default.
