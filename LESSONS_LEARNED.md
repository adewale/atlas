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

### 2026-07-12 — Social-card cache busts must change the image URL
**Context:** Diagnosing an X post that parsed Atlas's card metadata but displayed a grey image fallback.
**What happened:** X stored the correct `summary_large_image` title, description, domain, and alt text, but no processed image fields. Adding a query parameter to the page did not help because its canonical identity and `twitter:image` URL were unchanged.
**Resolution:** Bumped the immutable element-card path, encoded the fully opaque cards as RGB PNGs, and added PNG colour-type and metadata-path regressions.
**Rule:** When a social platform negatively caches an image fetch, publish a genuinely new image pathname; changing only the sharing page's query string is not an image-cache bust.
