// The 90 s demo scenario that dev mode loops. Same curve as the mockup's Scenario button.
#pragma once
#include <cstdint>

namespace dots {

constexpr uint32_t kScenarioMs = 90000;

/** 6 dots; a sudden drop to 3 that holds for 24 s; 2; 1 (Emergency); then a steady climb back to 6.
 *  Holds wobble ±2 like a live reading, always inside their band. `seconds` from 0 to 90. */
float scenarioPct(float seconds);

/** The scenario on a loop, `ms` after the loop started. It ends where it starts (92 %), so the loop has no jump. */
float scenarioPctLooped(uint32_t ms);

}  // namespace dots
