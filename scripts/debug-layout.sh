#!/usr/bin/env bash
set -euo pipefail

# debug-layout.sh — Fast layout overlap debugger using agent-browser
#
# Usage:
#   ./scripts/debug-layout.sh              # check all 5 elements
#   ./scripts/debug-layout.sh Fe           # check one element
#   ./scripts/debug-layout.sh --screenshot # also save annotated screenshots
#
# Requires: agent-browser (npm i -g agent-browser)
# Uses Playwright's Chrome when AGENT_BROWSER_EXECUTABLE_PATH is set.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SESSION="atlas-debug"
BASE_URL="${BASE_URL:-http://localhost:4173}"
SCREENSHOTS=false
ELEMENTS=()

# Parse args
for arg in "$@"; do
  case "$arg" in
    --screenshot|--screenshots) SCREENSHOTS=true ;;
    --help|-h)
      echo "Usage: $0 [element...] [--screenshot]"
      echo "  element: Fe, Ir, H, Og, Ba (default: all)"
      echo "  --screenshot: save annotated screenshots to debug-screenshots/"
      exit 0
      ;;
    *) ELEMENTS+=("$arg") ;;
  esac
done

if [ ${#ELEMENTS[@]} -eq 0 ]; then
  ELEMENTS=(Fe Ir H Og Ba)
fi

# Auto-detect Playwright Chrome if no executable set
if [ -z "${AGENT_BROWSER_EXECUTABLE_PATH:-}" ]; then
  PW_CHROME=$(find /root/.cache/ms-playwright -name chrome -type f 2>/dev/null | head -1)
  if [ -n "$PW_CHROME" ]; then
    export AGENT_BROWSER_EXECUTABLE_PATH="$PW_CHROME"
  fi
fi

# Ensure preview server is running
if ! curl -s -o /dev/null -w '' "$BASE_URL" 2>/dev/null; then
  echo "Starting preview server..."
  cd "$PROJECT_DIR"
  npx vite preview --port 4173 &>/dev/null &
  PREVIEW_PID=$!
  sleep 2
  if ! curl -s -o /dev/null "$BASE_URL" 2>/dev/null; then
    echo "ERROR: Preview server failed to start. Run 'npm run build' first."
    kill $PREVIEW_PID 2>/dev/null
    exit 1
  fi
  trap "kill $PREVIEW_PID 2>/dev/null" EXIT
else
  trap "" EXIT
fi

# Warm up the daemon (first command starts it)
agent-browser eval "1" --session "$SESSION" >/dev/null 2>&1 || true

# Block Google Fonts (hangs in sandboxed environments)
agent-browser network route "**/fonts.googleapis.com/**" --abort --session "$SESSION" >/dev/null 2>&1 || true

# Screenshot output dir
if [ "$SCREENSHOTS" = true ]; then
  mkdir -p "$PROJECT_DIR/debug-screenshots"
fi

# JS snippet: measure identity-text overlap
read -r -d '' JS_IDENTITY <<'JSEOF' || true
(() => {
  const identity = document.querySelector('.folio-identity');
  const svg = document.querySelector('svg[aria-label="Element summary"]');
  if (!identity || !svg) return JSON.stringify({ error: 'Missing elements' });
  const idRect = identity.getBoundingClientRect();
  const texts = svg.querySelectorAll('text');
  const overlapping = [];
  for (const t of texts) {
    const tRect = t.getBoundingClientRect();
    const hOverlap = tRect.left < idRect.right - 2 && tRect.right > idRect.left + 2;
    const vOverlap = tRect.top < idRect.bottom - 2 && tRect.bottom > idRect.top + 2;
    if (hOverlap && vOverlap) {
      overlapping.push(t.textContent.slice(0, 40) + ' at (' + Math.round(tRect.left) + ',' + Math.round(tRect.top) + ')');
    }
  }
  return JSON.stringify({
    identity: { w: Math.round(idRect.width), h: Math.round(idRect.height) },
    overlapping: overlapping
  });
})()
JSEOF

# JS snippet: measure plate-text overlap
read -r -d '' JS_PLATE <<'JSEOF' || true
(() => {
  const plate = document.querySelector('[data-testid="data-plate"]');
  const svg = document.querySelector('svg[aria-label="Element summary"]');
  if (!plate || !svg) return JSON.stringify({ error: 'No plate' });
  const plateRect = plate.getBoundingClientRect();
  const texts = svg.querySelectorAll('text');
  const overlapping = [];
  for (const t of texts) {
    const tRect = t.getBoundingClientRect();
    const hOverlap = tRect.left < plateRect.right - 2 && tRect.right > plateRect.left + 2;
    const vOverlap = tRect.top < plateRect.bottom - 2 && tRect.bottom > plateRect.top + 2;
    if (hOverlap && vOverlap) {
      overlapping.push(t.textContent.slice(0, 40) + ' at (' + Math.round(tRect.left) + ',' + Math.round(tRect.top) + ')');
    }
  }
  return JSON.stringify({ overlapping: overlapping });
})()
JSEOF

PASS=0
FAIL=0
ERRORS=()

parse_json_field() {
  python3 -c "
import sys, json
try:
    raw = sys.argv[1]
    d = json.loads(json.loads(raw))
    print(eval('d' + sys.argv[2]))
except Exception:
    print('?')
" "$1" "$2" 2>/dev/null
}

check_element() {
  local sym="$1"
  local url="$BASE_URL/elements/$sym"

  # Navigate via stdin eval (avoids shell escaping issues with URLs)
  echo "location.assign(\"$url\")" | agent-browser eval --stdin --session "$SESSION" --timeout 2000 >/dev/null 2>&1 || true
  sleep 2

  # Wait for folio to render
  if ! agent-browser wait .folio-identity --session "$SESSION" --timeout 8000 >/dev/null 2>&1; then
    echo "  SKIP $sym — page did not render"
    return 1
  fi

  # Brief pause for animations
  sleep 0.5

  # Screenshot if requested
  if [ "$SCREENSHOTS" = true ]; then
    agent-browser screenshot --annotate "$PROJECT_DIR/debug-screenshots/$sym.png" --session "$SESSION" >/dev/null 2>&1 || true
  fi

  # Measure identity and plate overlap
  local identity_result plate_result
  identity_result=$(echo "$JS_IDENTITY" | agent-browser eval --stdin --session "$SESSION" 2>/dev/null || echo '"{\"error\":\"eval failed\"}"')
  plate_result=$(echo "$JS_PLATE" | agent-browser eval --stdin --session "$SESSION" 2>/dev/null || echo '"{\"error\":\"eval failed\"}"')

  # Parse results
  local id_overlaps plate_overlaps id_height
  id_overlaps=$(parse_json_field "$identity_result" "['overlapping'].__len__()")
  plate_overlaps=$(parse_json_field "$plate_result" "['overlapping'].__len__()")
  id_height=$(parse_json_field "$identity_result" "['identity']['h']")

  local status="PASS"
  if [ "$id_overlaps" != "0" ] || [ "$plate_overlaps" != "0" ]; then
    status="FAIL"
    FAIL=$((FAIL + 1))
    ERRORS+=("$sym: identity=$id_overlaps plate=$plate_overlaps")
  else
    PASS=$((PASS + 1))
  fi

  printf "  %-4s %-4s  identity: %spx  overlaps: id=%s plate=%s\n" \
    "$status" "$sym" "$id_height" "$id_overlaps" "$plate_overlaps"
}

echo ""
echo "Layout overlap check (agent-browser)"
echo "====================================="
echo ""

START_TIME=$(date +%s%N)

for sym in "${ELEMENTS[@]}"; do
  check_element "$sym"
done

END_TIME=$(date +%s%N)
ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
ELAPSED_S=$(python3 -c "print(f'{$ELAPSED_MS / 1000:.1f}')")

echo ""
echo "-------------------------------------"
echo "  $PASS passed, $FAIL failed  (${ELAPSED_S}s)"

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "  Failures:"
  for err in "${ERRORS[@]}"; do
    echo "    - $err"
  done
fi

if [ "$SCREENSHOTS" = true ]; then
  echo ""
  echo "  Screenshots: debug-screenshots/"
fi

echo ""

# Exit with failure if any overlaps
[ $FAIL -eq 0 ]
