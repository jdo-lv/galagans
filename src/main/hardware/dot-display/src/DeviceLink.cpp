#include "DeviceLink.h"

#include <WebSocketsClient.h>
#include <WiFi.h>

namespace {
WebSocketsClient socket;
constexpr uint32_t kRetryMs = 5000;
constexpr uint32_t kPingMs = 5000;
constexpr uint32_t kPongTimeoutMs = 3000;
constexpr uint8_t kMissedPongs = 2;
constexpr uint32_t kStackBytes = 8192;
}  // namespace

void DeviceLink::start(const Settings &settings) {
  settings_ = settings;
  // Its own task, at the loop's priority: while it waits on a connect, the loop keeps drawing (one core or two).
  xTaskCreate(&DeviceLink::run, "device-link", kStackBytes, this, 1, nullptr);
}

void DeviceLink::run(void *self) { static_cast<DeviceLink *>(self)->serve(); }

void DeviceLink::serve() {
  const Settings &s = settings_;
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(s.ssid, s.password);
  Serial.printf("link: joining Wi-Fi \"%s\", then ws://%s:%u%s\n", s.ssid, s.host, s.port, s.path);

  socket.begin(s.host, s.port, s.path);
  socket.setReconnectInterval(kRetryMs);
  socket.enableHeartbeat(kPingMs, kPongTimeoutMs, kMissedPongs);
  socket.onEvent([this](WStype_t type, uint8_t *payload, size_t length) {
    switch (type) {
      case WStype_CONNECTED:
        connected_ = true;
        Serial.println("link: connected to the device link");
        break;
      case WStype_DISCONNECTED:
        if (connected_) Serial.println("link: lost the device link, retrying every 5 s");
        connected_ = false;
        break;
      case WStype_TEXT:
        settings_.onText(reinterpret_cast<const char *>(payload), length);
        break;
      default:
        break;
    }
  });

  bool wifiWasUp = false;
  for (;;) {
    const bool wifiUp = WiFi.status() == WL_CONNECTED;
    if (wifiUp != wifiWasUp) {
      wifiWasUp = wifiUp;
      if (wifiUp) Serial.printf("link: Wi-Fi up, address %s\n", WiFi.localIP().toString().c_str());
      else Serial.println("link: Wi-Fi down");
    }
    socket.loop();
    if (!wifiUp) connected_ = false;
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}
