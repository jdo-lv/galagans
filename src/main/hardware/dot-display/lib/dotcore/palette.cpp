#include "palette.h"

#include <cmath>

namespace dots {

uint16_t rgb565(Colour colour) {
  switch (colour) {
    case Colour::Blue: return kBlue;
    case Colour::Yellow: return kYellow;
    case Colour::Red: return kRed;
    default: return kWhite;
  }
}

uint16_t blend565(uint16_t colour, uint16_t background, float alpha) {
  const auto mix = [alpha](int a, int b) { return static_cast<int>(std::lround(b + (a - b) * alpha)); };
  const int r = mix(colour >> 11, background >> 11);
  const int g = mix((colour >> 5) & 0x3F, (background >> 5) & 0x3F);
  const int b = mix(colour & 0x1F, background & 0x1F);
  return static_cast<uint16_t>((r << 11) | (g << 5) | b);
}

}  // namespace dots
