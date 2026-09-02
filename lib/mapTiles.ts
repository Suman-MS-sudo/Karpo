// Shared Leaflet basemap config used by every map component in the app.
//
// We used to point at CARTO's basemaps.cartocdn.com tiles. CARTO now
// requires a registered API key for that endpoint — without one, tiles come
// back stamped "API KEY REQUIRED" instead of an actual map. Standard
// OpenStreetMap tiles remain free and keyless, so we use those everywhere
// instead. OSM only ships one (light) tile style, so "dark mode" maps are
// produced by CSS-filtering the tile pane rather than fetching separate dark
// tiles — see MAP_DARK_FILTER_CLASS.
export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
export const MAP_TILE_SUBDOMAINS = "abc"
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Kept for call sites that previously picked a URL based on dark mode —
// both branches now resolve to the same keyless OSM tile URL.
export function tileUrl(_dark?: boolean): string {
  return MAP_TILE_URL
}

// Apply to the Leaflet container element to recolor OSM's light tiles for
// dark mode (Tailwind arbitrary-variant targeting Leaflet's internal tile pane).
export const MAP_DARK_FILTER_CLASS =
  "dark:[&_.leaflet-tile-pane]:brightness-[.75] dark:[&_.leaflet-tile-pane]:invert dark:[&_.leaflet-tile-pane]:hue-rotate-180 dark:[&_.leaflet-tile-pane]:contrast-[.9] dark:[&_.leaflet-tile-pane]:saturate-[.85]"
