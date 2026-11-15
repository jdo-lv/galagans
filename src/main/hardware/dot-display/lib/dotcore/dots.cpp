#include "dots.h"

#include <cmath>

namespace dots {

int dotsFor(float pct) {
  const int dots = static_cast<int>(std::floor(pct * 6.0f / 100.0f)) + 1;
  return dots < 1 ? 1 : dots > 6 ? 6 : dots;
}

bool validPct(float pct) { return std::isfinite(pct) && pct >= 0.0f && pct <= 100.0f; }

Level levelFor(int dots, bool fourDotsYellow) {
  switch (dots) {
    case 6: return {"Nominal", Colour::White, false};
    case 5: return {"To do", Colour::Blue, false};
    case 4: return {"Watch", fourDotsYellow ? Colour::Yellow : Colour::White, false};
    case 3: return {"Check", Colour::Yellow, false};
    case 2: return {"Treat", Colour::Red, false};
    default: return {"Emergency", Colour::Red, true};
  }
}

}  // namespace dots
