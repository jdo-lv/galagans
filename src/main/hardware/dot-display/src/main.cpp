// Dot display: shows a 0–100 % value as 1–6 dots coloured by alert level. Settings in include/config.h.
#include <Arduino.h>

#include "Board.h"
#include "DeviceLink.h"
#include "Protocol.h"
#include "Screen.h"
#include "config.h"
#include "frame.h"
#include "scenario.h"
#include "view.h"

namespace {

constexpr bool sameText(const char *a, const char *b) { return *a == *b && (*a == '\0' || sameText(a + 1, b + 1)); }
static_assert(DEV_MODE || !sameText(WIFI_SSID, "your-network"),
              "Set WIFI_SSID, WIFI_PASSWORD and SERVER_HOST in include/config.h, or set DEV_MODE = true");
static_assert(BRIGHTNESS_PCT <= 100, "BRIGHTNESS_PCT is 0-100");

Screen screen;
DeviceLink deviceLink;
dots::State state;  // written by the link task (onText) and the loop: hold stateLock
portMUX_TYPE stateLock = portMUX_INITIALIZER_UNLOCKED;
dots::View shown;
bool drawn = false;

// Runs on the link task.
void onText(const char *text, size_t length) {
  const dots::FrameResult frame = dots::readFrame(text, length, kTopic);
  if (frame.kind == dots::FrameKind::Accepted) {
    taskENTER_CRITICAL(&stateLock);
    state.hasValue = true;
    state.pct = frame.pct;
    state.valueAtMs = millis();
    taskEXIT_CRITICAL(&stateLock);
  } else if (frame.kind == dots::FrameKind::Invalid) {
    Serial.printf("link: ignored a frame: %.*s\n", static_cast<int>(length > 200 ? 200 : length), text);
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  Serial.printf("dot display on %s\n", kBoardName);
  screen.begin(FLIP_SCREEN, BRIGHTNESS_PCT);
  state.simulated = DEV_MODE;
  if (DEV_MODE) {
    Serial.println("dot display: DEV_MODE, looping the 90 s scenario (no Wi-Fi, no server)");
  } else {
    deviceLink.start({WIFI_SSID, WIFI_PASSWORD, SERVER_HOST, SERVER_PORT, kDeviceLinkPath, onText});
  }
}

void loop() {
  dots::State snapshot;
  if (DEV_MODE) {
    const uint32_t ms = millis();
    state.hasValue = true;
    state.pct = dots::scenarioPctLooped(ms);
    state.valueAtMs = ms;
    snapshot = state;
  } else {
    const bool connected = deviceLink.connected();
    taskENTER_CRITICAL(&stateLock);
    state.connected = connected;
    state.everConnected = state.everConnected || connected;
    snapshot = state;
    taskEXIT_CRITICAL(&stateLock);
  }
  const uint32_t now = millis();  // after the snapshot, so a value never looks newer than now
  const dots::View view = dots::viewFor(snapshot, now, FOUR_DOTS_YELLOW);
  if (!drawn || view != shown) {
    screen.draw(view);
    shown = view;
    drawn = true;
  }
  delay(10);
}
