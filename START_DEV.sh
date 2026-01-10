#!/usr/bin/env bash
set -euo pipefail

# Determine script and repository root
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$script_dir"

# If the script isn't in a git repo, try common alternate locations
if [ ! -d "$repo_root/.git" ]; then
	if [ -d "$HOME/signals" ]; then
		repo_root="$HOME/signals"
	elif [ -d "/Users/sanjeevjha/signals" ]; then
		repo_root="/Users/sanjeevjha/signals"
	elif [ -d "/Users/Sanjeev/signals" ]; then
		repo_root="/Users/Sanjeev/signals"
	fi
fi

cd "$repo_root" || { echo "Failed to find repo root at $repo_root"; exit 1; }

# Kill any existing dev servers
echo "🔍 Checking for existing dev servers..."
pkill -f "next dev" || true
pkill -f "pnpm dev" || true
sleep 1

# Ensure port 3000 is available (we prefer to use 3000)
PORT_TO_USE=3000
echo "🔎 Checking port $PORT_TO_USE..."
if command -v lsof >/dev/null 2>&1; then
	pids=$(lsof -iTCP:$PORT_TO_USE -sTCP:LISTEN -t || true)
else
	pids=$(netstat -vanp tcp | awk '\$4 ~ /\.$PORT_TO_USE$/ {print \$9}' || true)
fi

if [ -n "$pids" ]; then
	echo "Port $PORT_TO_USE is in use by PID(s): $pids"
	for pid in $pids; do
		cmdline=$(ps -p "$pid" -o args= || true)
		echo " -> PID $pid: $cmdline"
		# Only kill processes that look like dev servers or node/pnpm processes
		if echo "$cmdline" | egrep -i "(node|next|pnpm|nodejs)" >/dev/null 2>&1; then
			echo "Stopping dev-related process $pid..."
			kill -TERM "$pid" 2>/dev/null || true
			# wait up to 5s for process to exit
			for i in {1..5}; do
				if kill -0 "$pid" 2>/dev/null; then
					sleep 1
				else
					break
				fi
			done
			if kill -0 "$pid" 2>/dev/null; then
				echo "Process $pid didn't exit; forcing kill..."
				kill -KILL "$pid" 2>/dev/null || true
			fi
			echo "Stopped $pid"
		else
			echo "PID $pid does not look like a dev/server process. Not killing. Please free port $PORT_TO_USE and retry." >&2
			exit 1
		fi
	done
	sleep 1
else
	echo "Port $PORT_TO_USE is free."
fi

# Load environment variables from .env if present
if [ -f .env ]; then
	set -a
	# shellcheck disable=SC1091
	source .env
	set +a
fi

echo "🚀 Starting dev server (trying PORT=3000)..."
if command -v pnpm >/dev/null 2>&1; then
	PORT=3000 pnpm dev
else
	echo "pnpm not found; please install pnpm or use npm/yarn" >&2
	exit 1
fi
