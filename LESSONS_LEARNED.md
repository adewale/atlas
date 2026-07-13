# Lessons Learned

### 2026-05-25 — Canvas text measurement must match rendered SVG font style
**Context:** Reviewing and fixing PR #30's first-load drop-cap overlap bug.
**What happened:** The PR correctly avoided Pretext's sticky singleton canvas, but the drop cap still overlapped on mobile because canvas measurement used `80px Cinzel...` while SVG rendered `fontWeight="bold"`. Canvas defaulted to weight 400, under-measuring the rendered 700-weight glyph. The E2E test also allowed false confidence by not requiring the web font to load and by permitting zero checked beside-drop-cap lines.
**Resolution:** Centralized the drop-cap font contract with `DROP_CAP_FONT_WEIGHT` and `dropCapCanvasFont()`, used that font for all drop-cap measurements, rendered the same weight in SVG, added an OffscreenCanvas fallback, and strengthened E2E assertions so cold-load tests require Cinzel to load and check at least one indented line.
**Rule:** Whenever text is measured for SVG layout, measure with the exact rendered font family, size, weight, and style; include enough ink-side bearing/gap for cross-platform font metrics; visual regression tests must fail if the font never loads or if no relevant geometry was checked.

### 2026-05-25 — Scope new CI browser projects to proven specs
**Context:** Verifying PR #30 after adding a mobile Playwright project to CI.
**What happened:** The existing full E2E suite is not mobile-project clean; running every spec under `--project=mobile` produced unrelated failures and made the PR build red even though the drop-cap regression passed.
**Resolution:** Scoped the CI mobile job to `tests/e2e/dropcap-overlap.spec.ts`, the regression this PR needs to guard, instead of running the entire desktop-oriented suite under a mobile viewport.
**Rule:** When adding a new browser/device CI project, either first make the whole suite pass under that project or scope the job to the specific specs that are known to support that device.

### 2026-05-25 — Mobile E2E assertions must match the mobile UI
**Context:** Cleaning up the broader E2E suite after PR #30 introduced a mobile Playwright project.
**What happened:** Several desktop specs asserted SVG grid geometry on pages that intentionally switch to accordion/card layouts on mobile. Visual screenshot comparisons were also treated as normal tests even though their baselines are OS/font-renderer sensitive.
**Resolution:** Kept desktop SVG geometry assertions on the desktop project, treated sectioned-card mobile layouts as separate coverage, broadened selectors only where the component truly renders in both modes, and made pixel visual regression opt-in with `RUN_VISUAL=1`.
**Rule:** Responsive tests should assert the layout actually rendered for that viewport; do not force desktop geometry expectations onto a different mobile component tree. Pixel snapshots belong behind an explicit opt-in unless the runner, OS, browser, and fonts are controlled.

### 2026-05-25 — Custom quality gates must run where their inputs exist
**Context:** Auditing all commits since April after PR #30 landed.
**What happened:** `npm run lint:all` had drifted red even though CI was green, and performance budget tests silently skipped in CI because `npm test` ran before `dist/` existed.
**Resolution:** Fixed the lint findings, added `lint:all` to CI, and added a post-build `lint:budgets` CI step so dist-based budget tests run against real build output.
**Rule:** If a script is described as a guardrail, CI must run it; if a test depends on generated build output, run it after the build rather than relying on skip-if-missing behavior.

### 2026-05-25 — Pages deploys need an explicit project name
**Context:** Deploying audit fixes to Cloudflare Pages.
**What happened:** `npm run deploy` built successfully but `wrangler pages deploy dist/` failed non-interactively with “Must specify a project name.” The account has a single Pages project named `atlas`, but Wrangler v4 still requires the project name in this context.
**Resolution:** Updated the deploy script to pass `--project-name atlas`.
**Rule:** Cloudflare Pages deploy scripts should include `--project-name <name>` so non-interactive deploys do not depend on Wrangler prompts or account inference.

### 2026-07-12 — Social-card validation must cover processing and cache identity
**Context:** Diagnosing an X post whose Atlas element page exposed valid Twitter Card, Open Graph, and Schema.org metadata but displayed a grey image fallback.
**What happened:** We treated standards-compliant metadata and a valid 1200×630 PNG as proof that the complete preview worked. The real pipeline is metadata parsing → page fetch → image fetch → image processing → cached preview. X stored the correct `summary_large_image` title, description, domain, and alt text, but no processed image fields, so parsing succeeded and image ingestion failed. The canvas default encoded fully opaque element cards as RGBA PNGs with an unnecessary alpha channel, while tests checked only the PNG signature, dimensions, size, and uniqueness. We generated all 118 cards before validating a production canary with the target platforms. Adding a query parameter to the page did not recover the preview because its canonical identity and `twitter:image` URL were unchanged, allowing the failed v1 image result to remain cached. A shared renderer also initially re-encoded the unversioned generic fallback without changing its URL; review caught and removed that unrelated change before release.
**Resolution:** Published the element cards at a genuinely new immutable v2 pathname, encoded only those fully opaque cards as 8-bit RGB PNGs, preserved every v1 asset and the generic fallback byte-for-byte, and added checks for colour type, bit depth, dimensions, hashes, uniqueness, response headers, and metadata-path consistency. Production verification fetched and hash-checked all 118 assets, and an independent metadata crawler extracted the correct Promethium image. Because the fix changed both the pathname and encoding, it proves that a new image cache key was necessary but does not prove that RGBA alone caused X's processing failure.
**Correct first approach:** Define the card contract up front (1200×630, 8-bit RGB without alpha, small static file, absolute HTTPS URL, correct content type, and bot-accessible response); deploy one representative element as a canary; validate its raw bot response, deployed bytes, and a fresh preview with X and Facebook or their debuggers; then generate the other 117 cards deterministically. Version the actual image pathname whenever its bytes or encoding change, retain older immutable versions, keep the generic renderer independent, and make platform canary validation a manual release gate where stable automation is unavailable. The static architecture—118 element cards with a generic fallback for comparisons—was sound; validating the canary first would have avoided retaining both the 7.65 MB v1 set and the 7.00 MB v2 set.
**Rule:** Treat social-card delivery as an end-to-end integration, not a markup check: validate one deployed, conservatively encoded canary on the target platforms before batch generation, and bust a failed image cache by changing the image pathname rather than the sharing page's query string.
