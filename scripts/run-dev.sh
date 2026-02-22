#!/usr/bin/env bash
set -euo pipefail

# Development-only wrapper:
# - stops stale MIDIFlow dev server processes scoped to this repo
# - launches the dev server in the foreground (Ctrl+C to stop)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

declare -a target_pids
declare -a target_cmds
declare -a repo_pids

target_pids=()
target_cmds=()
repo_pids=()

while IFS= read -r pid; do
  [[ -n "${pid}" ]] && repo_pids+=("${pid}")
done < <(pgrep -f "${REPO_ROOT}" 2>/dev/null || true)

for pid in "${repo_pids[@]+${repo_pids[@]}}"; do
  [[ -z "${pid}" ]] && continue
  [[ "${pid}" -eq "$$" || "${pid}" -eq "${PPID:-0}" ]] && continue

  cmd="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  [[ -z "${cmd}" ]] && continue

  if [[ "${cmd}" == *"${REPO_ROOT}"* ]] && [[ "${cmd}" == *"vite"* || "${cmd}" == *"npm run dev"* ]]; then
    target_pids+=("${pid}")
    target_cmds+=("${cmd}")
  fi
done

if ((${#target_pids[@]} > 0)); then
  echo "Found existing MIDIFlow dev process(es):"
  for i in "${!target_pids[@]}"; do
    echo "  PID ${target_pids[$i]}: ${target_cmds[$i]}"
  done

  echo "Stopping existing process(es) with SIGTERM..."
  for pid in "${target_pids[@]}"; do
    kill -TERM "${pid}" 2>/dev/null || true
  done

  deadline=$((SECONDS + 3))
  declare -a remaining_pids=()

  while ((SECONDS < deadline)); do
    remaining_pids=()
    for pid in "${target_pids[@]}"; do
      if kill -0 "${pid}" 2>/dev/null; then
        remaining_pids+=("${pid}")
      fi
    done

    if ((${#remaining_pids[@]} == 0)); then
      break
    fi

    sleep 0.2
  done

  if ((${#remaining_pids[@]} > 0)); then
    echo "Force-stopping remaining process(es) with SIGKILL: ${remaining_pids[*]}"
    for pid in "${remaining_pids[@]}"; do
      kill -KILL "${pid}" 2>/dev/null || true
    done
  fi
else
  echo "No existing MIDIFlow dev process found for ${REPO_ROOT}."
fi

cd "${REPO_ROOT}"
echo "Starting MIDIFlow dev server in foreground (Ctrl+C to stop)..."
exec npm run dev
