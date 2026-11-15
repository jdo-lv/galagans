// Pins per board, picked by the chip being built for. Both boards carry the same 1.47" JD9853 panel and take the
// same register setup. Sources: Waveshare's Arduino demo packages,
//   ESP32-C6-Touch-LCD-1.47  examples/06_lvgl_brightness   (the team's board)
//   ESP32-S3-Touch-LCD-1.47  examples/05_lvgl_brightness
#pragma once
#include <sdkconfig.h>

#include <cstdint>

struct BoardPins {
  int8_t dc, cs, sck, mosi, reset, backlight;
};

#if defined(CONFIG_IDF_TARGET_ESP32C6)
constexpr BoardPins kPins{15, 14, 1, 2, 22, 23};
constexpr char kBoardName[] = "ESP32-C6-Touch-LCD-1.47";
#elif defined(CONFIG_IDF_TARGET_ESP32S3)
constexpr BoardPins kPins{45, 21, 38, 39, 40, 46};
constexpr char kBoardName[] = "ESP32-S3-Touch-LCD-1.47";
#else
#error "No pins for this chip: add the board to src/Board.h"
#endif
