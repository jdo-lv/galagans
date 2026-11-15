#include "frame.h"

#include <ArduinoJson.h>

#include <cstring>

#include "dots.h"

namespace dots {

FrameResult readFrame(const char *json, size_t length, const char *topic) {
  JsonDocument doc;
  if (deserializeJson(doc, json, length)) return {FrameKind::Invalid, 0};
  const char *frameTopic = doc["topic"];
  if (frameTopic == nullptr) return {FrameKind::Invalid, 0};
  if (std::strcmp(frameTopic, topic) != 0) return {FrameKind::OtherTopic, 0};
  JsonVariantConst pct = doc["payload"]["pct"];
  if (!pct.is<float>()) return {FrameKind::Invalid, 0};
  const float value = pct.as<float>();
  if (!validPct(value)) return {FrameKind::Invalid, 0};
  return {FrameKind::Accepted, value};
}

}  // namespace dots
