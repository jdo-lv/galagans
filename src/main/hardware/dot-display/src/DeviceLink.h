#pragma once
#include <atomic>
#include <cstddef>
#include <cstdint>

/** Wi-Fi plus one WebSocket to the server's device link, like the crew app's DeviceLink: it reconnects every 5 s
 *  and queues nothing. A ping every 5 s (3 s timeout, 2 misses) notices a link that died without closing.
 *  It runs on its own task, because a reconnect blocks for up to 5 s while the screen must keep flashing.
 *  `onText` is called on that task. */
class DeviceLink {
 public:
  using OnText = void (*)(const char *text, size_t length);
  struct Settings {
    const char *ssid;
    const char *password;
    const char *host;
    uint16_t port;
    const char *path;
    OnText onText;
  };

  void start(const Settings &settings);
  bool connected() const { return connected_.load(); }

 private:
  static void run(void *self);
  void serve();

  Settings settings_{};
  std::atomic<bool> connected_{false};
};
