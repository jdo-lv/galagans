// Dot display settings. The first build copies this file to include/config.h: edit config.h, not this file.
// config.h is git-ignored because it holds the Wi-Fi password. Rebuild and flash after a change.
#pragma once
#include <cstdint>

// true:  no Wi-Fi and no server. The display loops the 90 s scenario on its own
//        (6 dots, drop to 3 and hold, then 2, then 1, then back up to 6) and says SIMULATED.
// false: joins the Wi-Fi network below, connects to the server's device link and shows what it receives.
constexpr bool DEV_MODE = true;

// Wi-Fi network (only used when DEV_MODE is false). 2.4 GHz only: neither chip has a 5 GHz radio.
constexpr char WIFI_SSID[] = "your-network";
constexpr char WIFI_PASSWORD[] = "your-password";

// The machine running the Spring Boot app (`mvn spring-boot:run`): its IP on that network and its port.
constexpr char SERVER_HOST[] = "192.168.1.10";
constexpr uint16_t SERVER_PORT = 8080;

// Display
constexpr bool FOUR_DOTS_YELLOW = false;  // false: 4 dots white (Watch has no colour, ideas/alert-levels.md); true: yellow
constexpr bool FLIP_SCREEN = false;       // true: turn the picture 180° when the board is mounted the other way up
constexpr uint8_t BRIGHTNESS_PCT = 80;    // backlight, 0–100
