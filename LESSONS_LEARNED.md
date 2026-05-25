# Lessons Learned

### 2026-05-25 — Canvas text measurement must match rendered SVG font style
**Context:** Reviewing and fixing PR #30's first-load drop-cap overlap bug.
**What happened:** The PR correctly avoided Pretext's sticky singleton canvas, but the drop cap still overlapped on mobile because canvas measurement used `80px Cinzel...` while SVG rendered `fontWeight="bold"`. Canvas defaulted to weight 400, under-measuring the rendered 700-weight glyph. The E2E test also allowed false confidence by not requiring the web font to load and by permitting zero checked beside-drop-cap lines.
**Resolution:** Centralized the drop-cap font contract with `DROP_CAP_FONT_WEIGHT` and `dropCapCanvasFont()`, used that font for all drop-cap measurements, rendered the same weight in SVG, added an OffscreenCanvas fallback, and strengthened E2E assertions so cold-load tests require Cinzel to load and check at least one indented line.
**Rule:** Whenever text is measured for SVG layout, measure with the exact rendered font family, size, weight, and style; visual regression tests must fail if the font never loads or if no relevant geometry was checked.
