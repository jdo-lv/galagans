#pragma once
#include <cstdint>

#include "view.h"

/** The board's 1.47" panel in landscape, 320 × 172. Draws into a frame buffer and sends it whole, so a redraw
 *  never flickers. Layout as in mockup 13: a band for the connection above the dots, the word and data age below. */
class Screen {
 public:
  void begin(bool flip, uint8_t brightnessPct);
  void draw(const dots::View &view);
};
