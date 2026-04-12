#!/bin/zsh
# Ensure homebrew tools are in PATH
export PATH="/opt/homebrew/bin:$PATH"
#
# Visual regression tests using /opt/homebrew/bin/agent-browser.
#
# Usage:
#   npm run test:visual                        # against localhost:4173
#   npm run test:visual -- http://example.com  # against any URL
#
# Update baselines:  npm run test:visual:update

set -euo pipefail

BASE_URL="${1:-http://localhost:4173}"
BASELINE_DIR="$(cd "$(dirname "$0")/visual-baselines" && pwd)"
DIFF_DIR="/tmp/atlas-visual-diffs"
FAILURES=0
THRESHOLD=2.0

mkdir -p "$DIFF_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}  ✓ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; FAILURES=$((FAILURES + 1)); }
info() { echo -e "${YELLOW}  … $1${NC}"; }

check_page() {
  local name="$1" path="$2"
  local baseline="${BASELINE_DIR}/${name}.png"
  local session="atlas-vr-${name}"

  local result=""
  if [[ -f "$baseline" ]]; then
    result=$(/opt/homebrew/bin/agent-browser --session "$session" batch \
      "set viewport 1280 720" \
      "open ${BASE_URL}${path}" "wait 3000" \
      "get title" \
      "screenshot ${DIFF_DIR}/${name}.current.png" \
      "diff screenshot --baseline ${baseline} --output ${DIFF_DIR}/${name}.diff.png" \
      --json)
  else
    result=$(/opt/homebrew/bin/agent-browser --session "$session" batch \
      "set viewport 1280 720" \
      "open ${BASE_URL}${path}" "wait 3000" \
      "get title" \
      --json)
  fi

  # Extract title
  local title
  title=$(echo "$result" | /opt/homebrew/bin/python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
  r = item.get('result', {})
  if isinstance(r, dict) and 'title' in r:
    print(r['title']); break
" 2>/dev/null || echo "")

  if [[ -n "$title" && "$title" != "null" ]]; then
    pass "${name}: ${title}"
  else
    fail "${name}: page failed to load"
    /opt/homebrew/bin/agent-browser --session "$session" close 2>/dev/null || true
    return
  fi

  # Extract visual diff
  if [[ -f "$baseline" ]]; then
    local mismatch
    mismatch=$(echo "$result" | /opt/homebrew/bin/python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
  cmd = item.get('command', [])
  if len(cmd) >= 2 and cmd[0] == 'diff' and cmd[1] == 'screenshot':
    print(item.get('result', {}).get('mismatchPercentage', 'unknown'))
    break
" 2>/dev/null || echo "unknown")

    if [[ "$mismatch" == "unknown" ]]; then
      info "  visual diff unavailable"
    elif /opt/homebrew/bin/python3 -c "exit(0 if float('${mismatch}') < ${THRESHOLD} else 1)" 2>/dev/null; then
      if [[ "$mismatch" == "0.0" || "$mismatch" == "0" ]]; then
        pass "  pixel-perfect match"
      else
        pass "  ${mismatch}% mismatch (< ${THRESHOLD}%)"
      fi
    else
      fail "  ${mismatch}% mismatch (see ${DIFF_DIR}/${name}.diff.png)"
    fi
  else
    info "  no baseline (run npm run test:visual:update)"
  fi

  /opt/homebrew/bin/agent-browser --session "$session" close 2>/dev/null || true
}

echo ""
echo "═══════════════════════════════════════════════"
echo " Atlas Visual Regression Tests"
echo " Base URL: ${BASE_URL}"
echo "═══════════════════════════════════════════════"
echo ""

check_page "table" "/"
check_page "elements_Fe" "/elements/Fe"
check_page "explore" "/explore"
check_page "phase-landscape" "/phase-landscape"
check_page "about" "/about"

echo ""
echo "═══════════════════════════════════════════════"
if [[ "$FAILURES" -eq 0 ]]; then
  echo -e "${GREEN} All checks passed${NC}"
else
  echo -e "${RED} ${FAILURES} check(s) failed${NC}"
  echo "  Diff artifacts: ${DIFF_DIR}/"
fi
echo "═══════════════════════════════════════════════"
echo ""

exit "$FAILURES"
