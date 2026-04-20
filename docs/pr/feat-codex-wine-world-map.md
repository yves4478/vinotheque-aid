# Pull Request

## Title

Improve wine world map views and region detail readability

## Description

### Summary

Improves the `/map` experience so the wine world map works both as a global overview and as a cellar inventory lens.

### What Changed

- replaced the previous static SVG world map with OpenStreetMap + Leaflet
- normalized region matching using `country + region` instead of raw region strings alone
- kept all catalog regions visible even when the cellar has no wines there yet
- added typical wine styles per region so region details stay meaningful without cellar coverage
- added zoom-based aggregation:
  - zoomed out: markers show cellar wine counts per country
  - zoomed in: markers show cellar wine counts per region
- made unmapped cellar origins explicit instead of silently dropping them
- improved the region detail card contrast and chip styling for readability on bright screens
- tightened the map/detail layout so it stacks better on iPhone and scales cleanly on tablet/laptop widths

### Review Notes

- `src/pages/WineMap.tsx`
  - contains the switch between country aggregation and region markers
  - keeps region visibility driven by the static region catalog
  - overlays real cellar counts from matched wines
- `src/data/wineRegions.ts`
  - contains normalized country-aware origin matching
  - contains the initial `wineRegionStyles` dataset used for regional descriptions and filtering

### Validation

- `git diff --check`
- targeted helper tests in `src/data/wineRegions.test.ts`

### Known Gaps

- typical wine styles are curated starter data, not a full appellation model
- region coverage is still limited by the entries present in `wineRegions`
- full build/test execution still depends on local package manager availability and installed dependencies
