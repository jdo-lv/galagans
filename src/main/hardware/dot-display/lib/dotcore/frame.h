// Reading one frame from the server's device link. Every device's frames arrive on the same socket.
#pragma once
#include <cstddef>
#include <cstdint>

namespace dots {

enum class FrameKind : uint8_t {
  Accepted,    // this display's topic with a valid pct
  OtherTopic,  // another device's frame: skip it quietly
  Invalid,     // not JSON, no topic, or this topic without a pct from 0 to 100: ignore it, keep the last value
};

struct FrameResult {
  FrameKind kind;
  float pct;  // set when Accepted
};

/** Reads `{"topic": ..., "payload": {"id", "t", "pct", "src"}}`, the device link's frame shape. */
FrameResult readFrame(const char *json, size_t length, const char *topic);

}  // namespace dots
