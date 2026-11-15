#include "Screen.h"

#include <Arduino_GFX_Library.h>
#include <U8g2lib.h>  // only for its Helvetica fonts

#include "Board.h"
#include "palette.h"

namespace {

// Layout in panel pixels, from mockup 13 (ideas/mockups/src/13-dot-display.html).
constexpr int16_t kWidth = 320;
constexpr int16_t kHeight = 172;
constexpr int16_t kRadius = 23;  // 46 px dots: 6 × 46 + 5 × 6 = 306 of 320
constexpr int16_t kStep = 52;
constexpr int16_t kFirstX = 30;
constexpr int16_t kDotsY = 86;
constexpr int16_t kRingWidth = 3;
constexpr int16_t kBannerY = 32;  // centre lines of the text
constexpr int16_t kWordY = 136;
constexpr int16_t kAgeY = 160;
constexpr float kStaleAlpha = 0.35f;

const uint8_t *const kBannerFont = u8g2_font_helvB24_tr;  // NO CONNECTION
const uint8_t *const kWordFont = u8g2_font_helvB18_tr;
const uint8_t *const kSmallFont = u8g2_font_helvR12_tr;

// The SPI bus class each of Waveshare's demos uses.
#if defined(CONFIG_IDF_TARGET_ESP32C6)
Arduino_DataBus *bus = new Arduino_HWSPI(kPins.dc, kPins.cs, kPins.sck, kPins.mosi);
#else
Arduino_DataBus *bus = new Arduino_ESP32SPI(kPins.dc, kPins.cs, kPins.sck, kPins.mosi);
#endif
// The JD9853 runs on the ST7789 driver plus Waveshare's register setup below. Its 172 columns sit 34 px into RAM.
Arduino_GFX *panel = new Arduino_ST7789(bus, kPins.reset, 0, false, 172, 320, 34, 0, 34, 0);
Arduino_Canvas *canvas = new Arduino_Canvas(kWidth, kHeight, panel);

// JD9853 register setup, as in Waveshare's demo (lcd_reg_init). Sent after the ST7789 init, before rotation.
void jd9853Init() {
  static const uint8_t ops[] = {
      BEGIN_WRITE, WRITE_COMMAND_8, 0x11, END_WRITE, DELAY, 120,  // out of sleep
      BEGIN_WRITE,
      WRITE_C8_D16, 0xDF, 0x98, 0x53,
      WRITE_C8_D8, 0xB2, 0x23,
      WRITE_COMMAND_8, 0xB7, WRITE_BYTES, 4, 0x00, 0x47, 0x00, 0x6F,
      WRITE_COMMAND_8, 0xBB, WRITE_BYTES, 6, 0x1C, 0x1A, 0x55, 0x73, 0x63, 0xF0,
      WRITE_C8_D16, 0xC0, 0x44, 0xA4,
      WRITE_C8_D8, 0xC1, 0x16,
      WRITE_COMMAND_8, 0xC3, WRITE_BYTES, 8, 0x7D, 0x07, 0x14, 0x06, 0xCF, 0x71, 0x72, 0x77,
      WRITE_COMMAND_8, 0xC4, WRITE_BYTES, 12,
      0x00, 0x00, 0xA0, 0x79, 0x0B, 0x0A, 0x16, 0x79, 0x0B, 0x0A, 0x16, 0x82,
      WRITE_COMMAND_8, 0xC8, WRITE_BYTES, 32,
      0x3F, 0x32, 0x29, 0x29, 0x27, 0x2B, 0x27, 0x28, 0x28, 0x26, 0x25, 0x17, 0x12, 0x0D, 0x04, 0x00,
      0x3F, 0x32, 0x29, 0x29, 0x27, 0x2B, 0x27, 0x28, 0x28, 0x26, 0x25, 0x17, 0x12, 0x0D, 0x04, 0x00,
      WRITE_COMMAND_8, 0xD0, WRITE_BYTES, 5, 0x04, 0x06, 0x6B, 0x0F, 0x00,
      WRITE_C8_D16, 0xD7, 0x00, 0x30,
      WRITE_C8_D8, 0xE6, 0x14,
      WRITE_C8_D8, 0xDE, 0x01,
      WRITE_COMMAND_8, 0xB7, WRITE_BYTES, 5, 0x03, 0x13, 0xEF, 0x35, 0x35,
      WRITE_COMMAND_8, 0xC1, WRITE_BYTES, 3, 0x14, 0x15, 0xC0,
      WRITE_C8_D16, 0xC2, 0x06, 0x3A,
      WRITE_C8_D16, 0xC4, 0x72, 0x12,
      WRITE_C8_D8, 0xBE, 0x00,
      WRITE_C8_D8, 0xDE, 0x02,
      WRITE_COMMAND_8, 0xE5, WRITE_BYTES, 3, 0x00, 0x02, 0x00,
      WRITE_COMMAND_8, 0xE5, WRITE_BYTES, 3, 0x01, 0x02, 0x00,
      WRITE_C8_D8, 0xDE, 0x00,
      WRITE_C8_D8, 0x35, 0x00,
      WRITE_C8_D8, 0x3A, 0x05,                                         // RGB565
      WRITE_COMMAND_8, 0x2A, WRITE_BYTES, 4, 0x00, 0x22, 0x00, 0xCD,   // columns 34–205
      WRITE_COMMAND_8, 0x2B, WRITE_BYTES, 4, 0x00, 0x00, 0x01, 0x3F,   // rows 0–319
      WRITE_C8_D8, 0xDE, 0x02,
      WRITE_COMMAND_8, 0xE5, WRITE_BYTES, 3, 0x00, 0x02, 0x00,
      WRITE_C8_D8, 0xDE, 0x00,
      WRITE_C8_D8, 0x36, 0x00,
      WRITE_COMMAND_8, 0x21,  // inversion on
      END_WRITE, DELAY, 10,
      BEGIN_WRITE, WRITE_COMMAND_8, 0x29, END_WRITE,  // display on
  };
  bus->batchOperation(ops, sizeof(ops));
}

/** Draws `text` centred across the panel, with its capitals centred on `centreY`. */
void centred(const char *text, int16_t centreY, const uint8_t *font, uint16_t colour) {
  canvas->setFont(font);
  canvas->setTextColor(colour);
  int16_t x1, y1;
  uint16_t w, h, capW, capH;
  canvas->getTextBounds("H", 0, 0, &x1, &y1, &capW, &capH);
  const int16_t baseline = centreY + static_cast<int16_t>(capH) / 2;
  canvas->getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  canvas->setCursor((kWidth - static_cast<int16_t>(w)) / 2 - x1, baseline);
  canvas->print(text);
}

void banner(const dots::View &v) {
  switch (v.banner) {
    case dots::Banner::NoConnection:
      if (v.bannerOn) centred("NO CONNECTION", kBannerY, kBannerFont, dots::kWhite);
      break;
    case dots::Banner::Connecting: centred("Connecting...", kBannerY, kSmallFont, dots::kMuted); break;
    case dots::Banner::Waiting: centred("Waiting for data", kBannerY, kSmallFont, dots::kMuted); break;
    case dots::Banner::Simulated: centred("SIMULATED", kBannerY, kSmallFont, dots::kMuted); break;
    case dots::Banner::None: break;
  }
}

}  // namespace

void Screen::begin(bool flip, uint8_t brightnessPct) {
  if (!panel->begin()) Serial.println("screen: panel did not start");
  jd9853Init();
  panel->setRotation(flip ? 3 : 1);
  if (!canvas->begin(GFX_SKIP_OUTPUT_BEGIN)) Serial.println("screen: no memory for the frame buffer");
  canvas->setTextWrap(false);
  canvas->fillScreen(dots::kBackground);
  canvas->flush();
  ledcAttach(kPins.backlight, 5000, 10);
  ledcWrite(kPins.backlight, 1023u * (brightnessPct > 100 ? 100 : brightnessPct) / 100);
}

void Screen::draw(const dots::View &v) {
  canvas->fillScreen(dots::kBackground);
  const uint16_t base = dots::rgb565(v.colour);
  const uint16_t fill = v.dim ? dots::blend565(base, dots::kBackground, kStaleAlpha) : base;
  for (int i = 0; i < 6; i++) {
    const int16_t x = kFirstX + i * kStep;
    if (i < v.lit && v.litOn) {
      canvas->fillCircle(x, kDotsY, kRadius, fill);
    } else {  // empty slot, also the dark half of the Emergency flash
      canvas->fillCircle(x, kDotsY, kRadius, dots::kRing);
      canvas->fillCircle(x, kDotsY, kRadius - kRingWidth, dots::kBackground);
    }
  }
  banner(v);
  if (v.word != nullptr) centred(v.word, kWordY, kWordFont, dots::kWhite);
  if (v.showAge) {
    char age[24];
    dots::formatAge(v.ageS, age, sizeof age);
    centred(age, kAgeY, kSmallFont, dots::kMuted);
  }
  canvas->flush();
}
