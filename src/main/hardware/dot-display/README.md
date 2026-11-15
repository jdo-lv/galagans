# Dot display

Firmware for Waveshare's 1.47" touch display boards (172 × 320 panel) that shows a 0–100 % value as 1–6 dots, coloured by alert level. Two boards build from the same code:

| PlatformIO env | Board | Chip |
|---|---|---|
| `c6` (default) | [ESP32-C6-Touch-LCD-1.47](https://docs.waveshare.com/ESP32-C6-Touch-LCD-1.47), the team's board | ESP32-C6FH8: single core, 8 MB flash in the chip, Wi-Fi 6 |
| `s3` | [ESP32-S3-Touch-LCD-1.47](https://www.waveshare.com/product/esp32-s3-touch-lcd-1.47.htm) | ESP32-S3R8 |

Not sure which you have? `esptool chip-id` names the chip (the boards look alike). Design and every screen state: mockup 13 ([PNG](../../../../ideas/mockups/13-dot-display.png), [interactive HTML](../../../../ideas/mockups/src/13-dot-display.html)).

| Value | Dots | Level | Colour |
|---|---|---|---|
| 84–100 % | 6 | Nominal | white |
| 67–83 % | 5 | To do | blue |
| 50–66 % | 4 | Watch | white (`FOUR_DOTS_YELLOW` makes it yellow) |
| 34–49 % | 3 | Check | yellow |
| 17–33 % | 2 | Treat | red |
| 0–16 % | 1 | Emergency | red, flashing 1 Hz |

Empty slots show as rings and the level word sits under the dots, so colour is never the only cue ([alert-levels.md](../../../../ideas/alert-levels.md)).

## Two modes

Set in `include/config.h`:

- **`DEV_MODE = true`** (the default): no Wi-Fi, no server. The display loops the 90 s scenario on its own (6 dots, a sudden drop to 3 that holds, then 2, then 1, then a steady climb back to 6) and shows SIMULATED above the dots.
- **`DEV_MODE = false`**: joins the Wi-Fi network, opens a WebSocket to the server's device link (`ws://SERVER_HOST:SERVER_PORT/ws/devices`) and shows each value it receives. "Connecting..." for the first 10 s, then "Waiting for data" until the first value. When the link drops, NO CONNECTION flashes above the dots (1 s on, 1 s off) and the last value stays with its age ("data 47 s old"). After 30 s without a value the dots dim. It reconnects every 5 s.

## Setup

1. Install PlatformIO Core 6.2.0 on Python 3.10–3.14 in its own virtualenv. The ESP32 platform refuses newer Pythons (Homebrew's `platformio` runs on 3.15). Don't use the `pio` inside `~/.platformio/penv` either: that copy belongs to the platform, reports `6.2.0.post1`, and fails the platform's own version check, which then deletes the platform.

   ```bash
   python3.14 -m venv ~/.local/share/platformio-cli && ~/.local/share/platformio-cli/bin/pip install platformio==6.2.0
   ```

   ```bash
   mkdir -p ~/.local/bin && ln -sf ~/.local/share/platformio-cli/bin/pio ~/.local/bin/pio
   ```

   Put `~/.local/bin` on your PATH ([PlatformIO shell commands](https://docs.platformio.org/en/latest/core/installation/shell-commands.html)). The [VS Code extension](https://platformio.org/install/ide?install=vscode) is the other route.
2. Build once from this folder. The first build creates `include/config.h` from `config.example.h` (git-ignored, it holds the Wi-Fi password) and downloads the ESP32 platform and toolchain into `~/.platformio` (about 6 GB, once).

   ```bash
   pio run
   ```

3. Edit `include/config.h`:

   | Setting | What |
   |---|---|
   | `DEV_MODE` | `true`: loop the scenario on the device. `false`: use Wi-Fi and the server |
   | `WIFI_SSID`, `WIFI_PASSWORD` | 2.4 GHz network (neither chip has a 5 GHz radio) |
   | `SERVER_HOST`, `SERVER_PORT` | The machine running `mvn spring-boot:run`, by IP on that network, port 8080 |
   | `FOUR_DOTS_YELLOW` | `false`: 4 dots white (Watch has no colour). `true`: yellow |
   | `FLIP_SCREEN` | `true` turns the picture 180° |
   | `BRIGHTNESS_PCT` | Backlight, 0–100 |

   With `DEV_MODE = false` the build stops with a message until `WIFI_SSID` is set.

4. Connect the board by USB-C and flash. The default env is the C6; for the S3 add `-e s3`.

   ```bash
   pio run -t upload
   ```

   If the upload says the port doesn't exist: Waveshare's factory demo drops off USB every so often, and a `pio` upload spends a few seconds checking the build first. Put the board in download mode (hold BOOT, press and release RESET, release BOOT), run the upload again, then press RESET when it's done. Or write the built image directly the moment the port is present:

   ```bash
   ~/.platformio/penv/bin/esptool --chip esp32c6 --port /dev/cu.usbmodem101 write-flash 0x0 .pio/build/c6/firmware.factory.bin
   ```

5. Optional: watch the log (Wi-Fi address, link state, ignored frames).

   ```bash
   pio device monitor
   ```

## No board at hand

The app shows the same screen in a browser, scaled to the window: `/device/simulation` loops the scenario like `DEV_MODE = true`, and `/device/websocket` listens to the device link like `DEV_MODE = false` (dev server `:5173`, built app `:8080`). Its rules (`src/main/frontend/src/device/dotDisplay.ts`) copy `lib/dotcore` with the same test cases, so change both together.

## Trying server mode without the backend

The backend's health engine publishes this value once a second while any device reading is fresh (run the Device Simulator at `/simulator.html`). To set a value by hand instead, stop the simulator's devices and let a script stand in (running both mixes two publishers on one topic):

1. Run the app (`mvn spring-boot:run` in the repository root) and set `SERVER_HOST` to that machine's IP.
2. From the repository root, send one value, or loop the scenario at one frame a second:

   ```bash
   node tools/publish-dot-display.mjs 72
   ```

   ```bash
   node tools/publish-dot-display.mjs --scenario
   ```

Stop the script and the display shows the age of its last value, then dims after 30 s. Stop the app and NO CONNECTION flashes.

## Contract

The relay sends every device's frames to every other open socket, so the display keeps its own topic and skips the rest.

- Topic `crew/a1/dot-display` (set in `src/Protocol.h`), published by the backend's health engine (`com.galagans.crewhealth.health`, src `backend-rules`) once a second.
- Payload `{id, t, pct, level, src, metrics}`; only `pct` is read: a number from 0 to 100. Any other frame on this topic is ignored and the last value stays.
- The relay stores nothing, so a frame sent while the display is offline is lost. The publisher should re-send its current value at least every 30 s, or the display will show the value as stale.
- Data age is the time since the display received the value; the display has no clock of its own.

## Tests

The logic (dot bands, levels, colours, scenario, frame reading, what the screen shows) lives in `lib/dotcore` with no Arduino code and runs on your machine:

```bash
pio test -e native
```

## Code

| Path | What |
|---|---|
| `include/config.example.h` | Settings template; your copy is `include/config.h` |
| `lib/dotcore/` | Pure logic: `dots` (bands, levels), `palette` (RGB565), `scenario`, `frame` (JSON), `view` (what to draw) |
| `src/Board.h` | Pins per board, picked by the chip being built for |
| `src/Screen.cpp` | The panel: Waveshare's JD9853 setup, landscape frame buffer, the mockup's layout |
| `src/DeviceLink.cpp` | Wi-Fi and the WebSocket on their own task (5 s reconnect, ping every 5 s), so a reconnect that blocks for up to 5 s never freezes the screen |
| `src/main.cpp` | Picks the mode, feeds the view, redraws only when it changes |
| `test/test_core/` | Native tests for `lib/dotcore` |

Board pins, from each board's Waveshare demo package (`Arduino/examples/*_lvgl_brightness`):

| | DC | CS | SCK | MOSI | LCD reset | Backlight | Touch SDA / SCL / reset / int (AXS5106L, not used yet) |
|---|---|---|---|---|---|---|---|
| C6 | 15 | 14 | 1 | 2 | 22 | 23 | 18 / 19 / 20 / 21 |
| S3 | 45 | 21 | 38 | 39 | 40 | 46 | 42 / 41 / 47 / 48 |

Both panels run on the GFX Library for Arduino's ST7789 driver plus the same JD9853 register setup, as in Waveshare's demos (the C6 demo uses `Arduino_HWSPI`, the S3 one `Arduino_ESP32SPI`). The demos ship the library at 1.5.9, which doesn't build on Arduino core 3.3; 1.6.9 sends the same ST7789 init sequence. The C6 uses the 8 MB partition layout (3.2 MB app slots): server mode fills 98 % of the default 1.3 MB.

## Not done yet

- Touch: the mockup's tap for the percentage and data age.
- The portrait (column) layout from the mockup.
- A backend publisher and a Device Simulator section for this topic.
- Hysteresis: a value hovering on a band edge would make the count flicker.
