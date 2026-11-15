// The dark-theme palette tokens (src/main/frontend/src/ui/theme/tokens.css) in RGB565, the panel's colour format.
#pragma once
#include <cstdint>

#include "dots.h"

namespace dots {

constexpr uint16_t kBackground = 0x18C3;  // #1B1B1B ink
constexpr uint16_t kWhite = 0xDEDB;       // #DADADA bone: level 0 and 2
constexpr uint16_t kBlue = 0x7D3E;        // #7FA6F0 blue tint: level 1
constexpr uint16_t kYellow = 0xFE25;      // #FFC72C caution yellow: level 3
constexpr uint16_t kRed = 0xE005;         // #E4002B bright red: levels 4 and 5
constexpr uint16_t kRing = 0x52A9;        // #52574E olive: empty slots
constexpr uint16_t kMuted = 0x840E;       // #868375 khaki: small status text

uint16_t rgb565(Colour colour);

/** `colour` laid over `background` at `alpha` (0 = background, 1 = colour), channel by channel. */
uint16_t blend565(uint16_t colour, uint16_t background, float alpha);

}  // namespace dots
