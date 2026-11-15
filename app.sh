#!/usr/bin/env bash
# One entry point (#51): starts the F25 voice host, the backend (:8080) and the Vite dev server (:5173); Ctrl+C stops all.
# Must run on macOS /bin/bash 3.2: no wait -n, associative arrays or mapfile.
set -u
cd "$(dirname "$0")" || exit 1

missing=0
for tool in mvn curl lsof; do
  command -v "$tool" >/dev/null || { echo "$tool not found."; missing=1; }
done
[ "$missing" = 0 ] || exit 1

busy=0
for port in 8080 5173; do
  read -r cmd pid _ <<< "$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | sed -n 2p)"
  [ -n "$pid" ] && { echo "Port $port is in use by $cmd (PID $pid). Stop it first."; busy=1; }
done
[ "$busy" = 0 ] || exit 1
