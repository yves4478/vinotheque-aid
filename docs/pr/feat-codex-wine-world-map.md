# feat/codex-wine-world-map

## Summary

Improves the `/map` experience so the wine world map is useful both as a world overview and as a cellar inventory lens.

## What Changed

- Replaced the previous static SVG map rendering with OpenStreetMap + Leaflet.
- Normalized region matching using `country + region` lookups instead of raw region strings alone.
- Kept all catalog regions visible, even when the cellar has no wines for them.
- Added typical wine styles per region so region details are meaningful without cellar coverage.
- Added zoom-based aggregation:
  - zoomed out: markers represent cellar wine counts per country
  - zoomed in: markers represent cellar wine counts per region
- Made unmapped cellar origins explicit instead of silently dropping them.

## Review Notes

- `src/pages/WineMap.tsx`
  - contains the view-mode switch between country aggregation and per-region markers
  - keeps region visibility driven by the static region catalog
  - overlays real cellar counts from matched wines
- `src/data/wineRegions.ts`
  - contains normalized country-aware origin matching
  - contains the initial `wineRegionStyles` dataset used for region-level descriptions and filtering

## Validation

- `git diff --check`
- targeted helper tests in `src/data/wineRegions.test.ts`

## Known Gaps

- Typical wine styles are curated starter data, not an exhaustive appellation model.
- Coverage is still limited by the regions present in `wineRegions`.
- Full build/test execution still depends on local package manager availability and installed dependencies.
