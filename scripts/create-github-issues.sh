#!/usr/bin/env bash
# Creates one GitHub issue per deliverable folder, with its task list, plus labels.
# Requires the GitHub CLI (https://cli.github.com) logged in: `gh auth login`.
#
# Usage (run from the repo root):
#   scripts/create-github-issues.sh --dry-run   # print what would be created
#   scripts/create-github-issues.sh             # create labels and issues
set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

cd "$(dirname "$0")/.."

if [[ $DRY_RUN -eq 0 ]]; then
  command -v gh >/dev/null || { echo "Install the GitHub CLI first: https://cli.github.com"; exit 1; }
  for label in "deliverable:0E8A16" "required:D93F0B" "recommended:FBCA04" "task:C5DEF5" "organisers:5319E7"; do
    gh label create "${label%%:*}" --color "${label##*:}" --force >/dev/null
  done
fi

for readme in deliverables/[0-9][0-9]-*/README.md; do
  folder="$(dirname "$readme")"
  heading="$(head -n1 "$readme" | sed 's/^# //')"          # "03 — Working prototype"
  num="${heading%% *}"
  name="${heading#* — }"
  title="[$num] $name"

  # "Guide says: Required ..." -> required / recommended label
  guide_line="$(grep -m1 'Guide says:' "$readme" || true)"
  # Any mandatory part (e.g. "Slides required; slide count recommended") counts as required
  if grep -qi 'required' <<<"$guide_line"; then kind="required"; else kind="recommended"; fi

  # Owner from the status line
  owner="$(grep -m1 -o 'Owner:\*\* [^·]*' "$readme" | sed 's/Owner:\*\* //; s/ *$//' || true)"

  # Copy the "## Tasks" section (up to the next "## " heading)
  tasks="$(awk '/^## Tasks/{flag=1; next} /^## /{flag=0} flag' "$readme")"
  # Rewrite README-relative links so they resolve from the issue page (/owner/repo/issues/N)
  tasks="$(sed -e 's#](\.\./\.\./#](../tree/main/#g' -e 's#](\.\./#](../tree/main/deliverables/#g' <<<"$tasks")"

  body="$(cat <<BODY
**Folder:** [\`$folder\`](../tree/main/$folder) — requirement, files and definition of done are in its README.
**Owner:** $owner

### Tasks
$tasks

_Tick boxes here or in the README; keep both in step. Close this issue when the folder's Definition of done is met._
BODY
)"

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "=== $title  [labels: deliverable, $kind]"
    echo "$body" | head -n 8
    echo "    ... ($(grep -c '^\s*- \[' <<<"$tasks") tasks)"
    echo
  else
    gh issue create --title "$title" --label deliverable --label "$kind" --body "$body"
  fi
done
