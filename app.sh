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

ROOT=$PWD
COMPOSE_FILE=voice-host/compose.yaml
VOICE_WAIT=600
STATE=$(mktemp -d)
SETUP='' BACKEND='' FRONTEND='' VOICE=''

# Lines show as they come; TERM is ignored so the prefix outlives the process it reads from during the stop.
prefix() {
  trap '' TERM
  while IFS= read -r line; do printf '%s %s\n' "$1" "$line"; done
}

ok() { [ "$(curl -s -o /dev/null --max-time 2 -w '%{http_code}' "$1")" = 200 ]; }

row() { printf '%-18s%s\n' "$1" "$2"; }

# The processes at the bottom of a job (the JVM, node, docker-compose): parents like mvn and npm exit after them.
leaves() {
  local kids child
  kids=$(pgrep -P "$1")
  [ -n "$kids" ] || { echo "$1"; return; }
  for child in $kids; do leaves "$child"; done
}

halt() { [ -n "$1" ] && kill -TERM $(leaves "$1") 2>/dev/null; }

vm_running() { [ "$(uname)" != Darwin ] || [ "$(podman machine inspect --format '{{.State}}' 2>/dev/null)" = running ]; }

stop() {
  trap '' INT TERM HUP
  local voice_state down=''
  voice_state=$(cat "$STATE/voice" 2>/dev/null)
  if [ -n "$VOICE" ]; then
    local voice_leaves
    voice_leaves=$(leaves "$VOICE")
    kill -TERM "$VOICE" $voice_leaves 2>/dev/null
  fi
  halt "$SETUP"
  halt "$BACKEND"
  halt "$FRONTEND"
  if command -v podman >/dev/null && [ "$voice_state" != machine-start ] && vm_running; then
    ( podman compose -f "$COMPOSE_FILE" down 2>&1 | prefix '[voice]' ) &
    down=$!
  fi
  wait $SETUP $BACKEND $FRONTEND $down 2>/dev/null
  rm -rf "$STATE"
  exit "$1"
}

trap 'stop 0' INT TERM
# A closed terminal can't take output any more; writing to it must not break the cleanup.
trap 'exec >/dev/null 2>&1; stop 0' HUP

if [ ! -x target/node/node ] || [ ! -f src/main/frontend/node_modules/.package-lock.json ]; then
  # Only the pom's Node and npm ci executions: no Kotlin compile, no PWA rebuild.
  ( mvn "frontend:install-node-and-npm@install node and npm" "frontend:npm@npm install" 2>&1 | prefix '[setup]'
    exit "${PIPESTATUS[0]}" ) &
  SETUP=$!
  # In the background so a stop signal is handled at once, not after setup ends.
  wait "$SETUP" || { echo "Frontend setup failed."; rm -rf "$STATE"; exit 1; }
  SETUP=''
fi

voice() {
  off() { echo "off ($1)" > "$STATE/voice"; }
  command -v podman >/dev/null || { off "podman not found"; return; }
  if [ "$(uname)" = Darwin ]; then
    [ -n "$(podman machine list --format '{{.Name}}' 2>/dev/null)" ] ||
      { off "no Podman VM: podman machine init --memory 8192 --now"; return; }
    local memory
    memory=$(podman machine inspect --format '{{.Resources.Memory}}' 2>/dev/null)
    case $memory in '' | *[!0-9]*) memory=0 ;; esac
    [ "$memory" -ge 8192 ] ||
      { off "Podman VM has $memory MiB, needs 8192: podman machine set --memory 8192"; return; }
    if [ "$(podman machine inspect --format '{{.State}}' 2>/dev/null)" != running ]; then
      echo machine-start > "$STATE/voice"
      podman machine start 2>&1 | prefix '[voice]'
      [ "${PIPESTATUS[0]}" = 0 ] || { off "Podman VM didn't start"; return; }
    fi
  fi
  echo compose-up > "$STATE/voice"
  podman compose -f "$COMPOSE_FILE" up -d --build 2>&1 | prefix '[voice]'
  [ "${PIPESTATUS[0]}" = 0 ] || { off "podman compose failed, see [voice] lines"; return; }
  echo "up $(date +%s)" > "$STATE/voice"
}

( mvn spring-boot:run -DskipFrontend=true 2>&1 | prefix '[backend]' ) &
BACKEND=$!
( cd src/main/frontend && PATH="$ROOT/target/node:$PATH" npm run dev 2>&1 | prefix '[frontend]' ) &
FRONTEND=$!
voice &
VOICE=$!

voice_status='' shown=''
while :; do
  kill -0 "$BACKEND" 2>/dev/null || { echo "backend exited; stopping everything."; stop 1; }
  kill -0 "$FRONTEND" 2>/dev/null || { echo "frontend exited; stopping everything."; stop 1; }
  if [ -z "$voice_status" ] || [ "$voice_status" = late ]; then
    state=$(cat "$STATE/voice" 2>/dev/null)
    case $state in
      off*) voice_status=$state ;;
      up\ *)
        if ok http://localhost:8081/health && ok http://localhost:8082/ && ok http://localhost:8084/; then
          [ "$voice_status" = late ] && [ -n "$shown" ] && row "Voice:" ready
          voice_status=ready
        elif [ -z "$voice_status" ] && [ $(($(date +%s) - ${state#up })) -ge "$VOICE_WAIT" ]; then
          voice_status=late
        fi
        ;;
    esac
  fi
  if [ -z "$shown" ] && [ -n "$voice_status" ] && ok http://localhost:8080/actuator/health && ok http://localhost:5173/; then
    row "Crew app:" http://localhost:5173
    row "Device Simulator:" http://localhost:5173/simulator.html
    if [ "$voice_status" = late ]; then
      row "Voice:" "not ready after 10 min (podman compose -f $COMPOSE_FILE logs -f llm)"
    else
      row "Voice:" "$voice_status"
    fi
    echo "Ctrl+C stops everything."
    shown=1
  fi
  sleep 1 &
  wait $!
done
