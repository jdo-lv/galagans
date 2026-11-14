#!/bin/sh
# Render mockup HTML to ../NN-name.png with headless Chrome. Usage: ./render.sh [file.html ...]
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in ${@:-*.html}; do
  size=1280,800; [ "$f" = 05-architecture.html ] && size=1600,1000
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=$size --virtual-time-budget=4000 \
    --screenshot="$PWD/../${f%.html}.png" "file://$PWD/$f" 2>/dev/null
  echo "rendered ${f%.html}.png"
done
