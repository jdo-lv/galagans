#include "view.h"

#include <cstdio>

namespace dots {

bool View::operator==(const View &o) const {
  return lit == o.lit && colour == o.colour && litOn == o.litOn && dim == o.dim && banner == o.banner &&
         bannerOn == o.bannerOn && word == o.word && showAge == o.showAge && ageS == o.ageS;
}

View viewFor(const State &s, uint32_t now, bool fourDotsYellow) {
  View v;
  if (s.simulated) {
    v.banner = Banner::Simulated;
  } else if (!s.connected) {
    if (s.everConnected || now >= kConnectGraceMs) {
      v.banner = Banner::NoConnection;
      v.bannerOn = (now / kNoConnectionFlashMs) % 2 == 0;
    } else {
      v.banner = Banner::Connecting;
    }
  } else if (!s.hasValue) {
    v.banner = Banner::Waiting;
  }
  if (!s.hasValue) return v;

  const int lit = dotsFor(s.pct);
  const Level level = levelFor(lit, fourDotsYellow);
  const uint32_t ageMs = now - s.valueAtMs;
  const bool stale = !s.simulated && ageMs > kStaleMs;
  v.lit = lit;
  v.colour = level.colour;
  v.word = level.word;
  v.dim = stale;
  v.litOn = !(level.flashes && !stale && (now / kEmergencyFlashMs) % 2 == 1);
  v.showAge = !s.simulated && (stale || !s.connected);
  v.ageS = v.showAge ? ageMs / 1000 : 0;
  return v;
}

void formatAge(uint32_t seconds, char *out, size_t size) {
  if (seconds < 60) {
    std::snprintf(out, size, "data %u s old", static_cast<unsigned>(seconds));
  } else if (seconds < 3600) {
    std::snprintf(out, size, "data %u min old", static_cast<unsigned>(seconds / 60));
  } else {
    std::snprintf(out, size, "data %u h old", static_cast<unsigned>(seconds / 3600));
  }
}

}  // namespace dots
