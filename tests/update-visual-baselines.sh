#!/bin/zsh
# Ensure tools are in PATH
export PATH="/opt/homebrew/bin:$PATH"

set -euo pipefail

BASE_URL="${1:-http://localhost:4173}"
BASELINE_DIR="$(cd "$(dirname "$0")/visual-baselines" && pwd)"

PAGES=(
  "table /"
  "elements_Fe /elements/Fe"
  "explore /explore"
  "phase-landscape /phase-landscape"
  "about /about"
)

echo "Updating visual baselines from ${BASE_URL}..."

for entry in "${PAGES[@]}"; do
  name="${entry%% *}"
  path="${entry#* }"
  agent-browser --session atlas-update batch \
    "set viewport 1280 720" \
    "open ${BASE_URL}${path}" "wait 3000" \
    "screenshot ${BASELINE_DIR}/${name}.png" \
    2>/dev/null
  echo "  ✓ ${name}"
done

agent-browser --session atlas-update close 2>/dev/null || true
echo ""
echo "Done. Commit: git add tests/visual-baselines/ && git commit -m 'Update visual baselines'"
