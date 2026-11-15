#include "scenario.h"

#include <cmath>

namespace dots {

namespace {
float roundHalfUp(float x) { return std::floor(x + 0.5f); }  // as JavaScript's Math.round in the mockup
}  // namespace

float scenarioPct(float t) {
  constexpr float kEnd = kScenarioMs / 1000.0f;
  const float wobble = roundHalfUp(2.0f * std::sin(t * 1.3f));
  if (t < 6) return std::fmin(100.0f, 92 + wobble);  // 6 dots
  if (t < 30) return 42 + wobble;                     // 3 dots, held
  if (t < 40) return 25 + wobble;                     // 2 dots
  if (t < 52) return 8 + wobble;                      // 1 dot
  return roundHalfUp(8 + (std::fmin(t, kEnd) - 52) / (kEnd - 52) * 84);  // back to 92: a band about every 7.5 s
}

float scenarioPctLooped(uint32_t ms) { return scenarioPct((ms % kScenarioMs) / 1000.0f); }

}  // namespace dots
