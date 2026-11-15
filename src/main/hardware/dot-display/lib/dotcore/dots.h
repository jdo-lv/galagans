// The rules of the dot display: how a 0–100 % value becomes 1–6 dots and an alert level.
// Pure C++, no Arduino, so it runs in the native tests. Mirrors mockup 13 (ideas/mockups/src/13-dot-display.html).
#pragma once
#include <cstdint>

namespace dots {

/** 0–16 → 1, 17–33 → 2, 34–49 → 3, 50–66 → 4, 67–83 → 5, 84–100 → 6: each sixth of the range goes up a dot. */
int dotsFor(float pct);

/** A value the display accepts: a finite number from 0 to 100. */
bool validPct(float pct);

enum class Colour : uint8_t { White, Blue, Yellow, Red };

struct Level {
  const char *word;
  Colour colour;
  bool flashes;  // only Emergency
};

/** The alert level for `dots` (1–6), where dots = 6 − level (ideas/alert-levels.md). Level 2 Watch has no
 *  colour, so 4 dots are white, unless `fourDotsYellow`. */
Level levelFor(int dots, bool fourDotsYellow);

}  // namespace dots
