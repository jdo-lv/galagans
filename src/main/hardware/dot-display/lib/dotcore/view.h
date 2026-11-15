// What the screen shows at a given moment, worked out from what the display knows. The renderer only paints it.
#pragma once
#include <cstddef>
#include <cstdint>

#include "dots.h"

namespace dots {

constexpr uint32_t kStaleMs = 30000;             // no frame for 30 s: dots dim, the data age shows
constexpr uint32_t kConnectGraceMs = 10000;      // after boot, "Connecting..." for 10 s before NO CONNECTION
constexpr uint32_t kEmergencyFlashMs = 500;      // 1 dot: 1 Hz
constexpr uint32_t kNoConnectionFlashMs = 1000;  // NO CONNECTION: 1 s on, 1 s off, so it never looks like Emergency

/** What the display knows. Times are milliseconds since boot. */
struct State {
  bool simulated = false;      // dev mode: values come from the scenario, not the server
  bool connected = false;      // WebSocket to the device link is open
  bool everConnected = false;  // it was open at least once since boot
  bool hasValue = false;
  float pct = 0;
  uint32_t valueAtMs = 0;  // when the last accepted value arrived
};

enum class Banner : uint8_t { None, Connecting, Waiting, NoConnection, Simulated };

struct View {
  int lit = 0;                 // dots drawn filled; the other slots are empty rings. 0 before the first value
  Colour colour = Colour::White;
  bool litOn = true;           // false in the dark half of the Emergency flash
  bool dim = false;            // the value is stale
  Banner banner = Banner::None;
  bool bannerOn = true;        // false in the dark half of the NO CONNECTION flash
  const char *word = nullptr;  // the level word under the dots, none before the first value
  bool showAge = false;
  uint32_t ageS = 0;

  bool operator==(const View &other) const;
  bool operator!=(const View &other) const { return !(*this == other); }
};

View viewFor(const State &state, uint32_t nowMs, bool fourDotsYellow);

/** "data 47 s old", "data 2 min old", "data 3 h old". */
void formatAge(uint32_t seconds, char *out, size_t size);

}  // namespace dots
