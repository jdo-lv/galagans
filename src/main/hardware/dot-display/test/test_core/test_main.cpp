// Logic tests, run on the development machine: pio test -e native
#include <unity.h>

#include <cmath>
#include <cstring>
#include <string>
#include <vector>

#include "dots.h"
#include "frame.h"
#include "palette.h"
#include "scenario.h"
#include "view.h"

using namespace dots;

void setUp() {}
void tearDown() {}

// ---- dotsFor: 0–16 → 1, 17–33 → 2, 34–49 → 3, 50–66 → 4, 67–83 → 5, 84–100 → 6 ---------------------

void test_dots_for_each_band_edge() {
  const float pct[] = {0, 16, 16.6f, 16.7f, 33, 34, 49, 50, 66, 67, 83, 84, 100};
  const int expected[] = {1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6};
  for (size_t i = 0; i < sizeof(pct) / sizeof(pct[0]); i++) {
    TEST_ASSERT_EQUAL_INT_MESSAGE(expected[i], dotsFor(pct[i]), std::to_string(pct[i]).c_str());
  }
}

void test_valid_pct_is_a_finite_number_from_0_to_100() {
  TEST_ASSERT_TRUE(validPct(0));
  TEST_ASSERT_TRUE(validPct(100));
  TEST_ASSERT_TRUE(validPct(72.5f));
  TEST_ASSERT_FALSE(validPct(-0.1f));
  TEST_ASSERT_FALSE(validPct(100.1f));
  TEST_ASSERT_FALSE(validPct(NAN));
  TEST_ASSERT_FALSE(validPct(INFINITY));
}

// ---- levelFor: dots = 6 − alert level (ideas/alert-levels.md) ------------------------------------------

void test_levels_follow_the_alert_scale() {
  struct Row { int dots; const char *word; Colour colour; bool flashes; };
  const Row rows[] = {
      {6, "Nominal", Colour::White, false}, {5, "To do", Colour::Blue, false},
      {4, "Watch", Colour::White, false},   {3, "Check", Colour::Yellow, false},
      {2, "Treat", Colour::Red, false},     {1, "Emergency", Colour::Red, true},
  };
  for (const Row &row : rows) {
    const Level level = levelFor(row.dots, false);
    TEST_ASSERT_EQUAL_STRING(row.word, level.word);
    TEST_ASSERT_EQUAL_INT(static_cast<int>(row.colour), static_cast<int>(level.colour));
    TEST_ASSERT_EQUAL(row.flashes, level.flashes);
  }
}

void test_four_dots_turn_yellow_only_when_configured() {
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Colour::Yellow), static_cast<int>(levelFor(4, true).colour));
  TEST_ASSERT_EQUAL_STRING("Watch", levelFor(4, true).word);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Colour::Blue), static_cast<int>(levelFor(5, true).colour));
}

// ---- palette -----------------------------------------------------------------------------------------

void test_colours_map_to_the_dark_palette_in_rgb565() {
  TEST_ASSERT_EQUAL_HEX16(0xDEDB, rgb565(Colour::White));   // #DADADA
  TEST_ASSERT_EQUAL_HEX16(0x7D3E, rgb565(Colour::Blue));    // #7FA6F0
  TEST_ASSERT_EQUAL_HEX16(0xFE25, rgb565(Colour::Yellow));  // #FFC72C
  TEST_ASSERT_EQUAL_HEX16(0xE005, rgb565(Colour::Red));     // #E4002B
}

void test_blend_mixes_a_colour_over_the_background() {
  TEST_ASSERT_EQUAL_HEX16(kRed, blend565(kRed, kBackground, 1.0f));
  TEST_ASSERT_EQUAL_HEX16(kBackground, blend565(kRed, kBackground, 0.0f));
  const uint16_t dim = blend565(kWhite, kBackground, 0.35f);
  TEST_ASSERT_TRUE((dim >> 11) > (kBackground >> 11) && (dim >> 11) < (kWhite >> 11));
}

// ---- scenario: the same curve as mockup 13 -------------------------------------------------------------

void test_scenario_changes_dots_at_the_mockup_times() {
  std::vector<std::pair<int, int>> changes;  // (second, dots)
  int previous = 0;
  for (int s = 0; s <= 90; s++) {
    const int d = dotsFor(scenarioPct(static_cast<float>(s)));
    if (d != previous) changes.emplace_back(s, d);
    previous = d;
  }
  const std::vector<std::pair<int, int>> expected = {{0, 6},  {6, 3},  {30, 2}, {40, 1}, {56, 2},
                                                     {64, 3}, {71, 4}, {79, 5}, {87, 6}};
  TEST_ASSERT_EQUAL_INT(expected.size(), changes.size());
  for (size_t i = 0; i < expected.size(); i++) {
    TEST_ASSERT_EQUAL_INT(expected[i].first, changes[i].first);
    TEST_ASSERT_EQUAL_INT(expected[i].second, changes[i].second);
  }
}

void test_scenario_stays_in_range_and_loops_every_90_s() {
  for (float t = 0; t <= 90; t += 0.25f) TEST_ASSERT_TRUE(validPct(scenarioPct(t)));
  TEST_ASSERT_EQUAL_FLOAT(scenarioPct(12.0f), scenarioPctLooped(12000));
  TEST_ASSERT_EQUAL_FLOAT(scenarioPct(12.0f), scenarioPctLooped(kScenarioMs + 12000));
  TEST_ASSERT_EQUAL_FLOAT(scenarioPct(12.0f), scenarioPctLooped(5 * kScenarioMs + 12000));
}

// ---- readFrame: {"topic", "payload": {id, t, pct, src}} from the device link -----------------------------

static FrameResult read(const std::string &json) { return readFrame(json.c_str(), json.size(), "crew/a1/dot-display"); }

void test_frame_with_the_topic_and_a_valid_pct_is_accepted() {
  const FrameResult r = read(
      R"({"topic":"crew/a1/dot-display","payload":{"id":"6f1c","t":"2026-11-15T09:31:00.000Z","pct":72,"src":"synthetic"}})");
  TEST_ASSERT_EQUAL_INT(static_cast<int>(FrameKind::Accepted), static_cast<int>(r.kind));
  TEST_ASSERT_EQUAL_FLOAT(72.0f, r.pct);
  TEST_ASSERT_EQUAL_FLOAT(41.5f, read(R"({"topic":"crew/a1/dot-display","payload":{"pct":41.5}})").pct);
}

void test_frame_for_another_device_is_skipped() {
  const FrameResult r = read(R"({"topic":"crew/a1/oximeter","payload":{"id":"a","t":"x","spo2_pct":97,"src":"synthetic"}})");
  TEST_ASSERT_EQUAL_INT(static_cast<int>(FrameKind::OtherTopic), static_cast<int>(r.kind));
}

void test_frame_with_a_bad_pct_is_invalid() {
  const char *bad[] = {
      R"({"topic":"crew/a1/dot-display","payload":{"pct":140}})",
      R"({"topic":"crew/a1/dot-display","payload":{"pct":-1}})",
      R"({"topic":"crew/a1/dot-display","payload":{"pct":"72"}})",
      R"({"topic":"crew/a1/dot-display","payload":{"pct":null}})",
      R"({"topic":"crew/a1/dot-display","payload":{}})",
      R"({"topic":"crew/a1/dot-display"})",
      R"({"payload":{"pct":72}})",
      R"(not json)",
      R"({"topic":"crew/a1/dot-display","payload":{"pct":7)",
  };
  for (const char *json : bad) {
    TEST_ASSERT_EQUAL_INT_MESSAGE(static_cast<int>(FrameKind::Invalid), static_cast<int>(read(json).kind), json);
  }
}

// ---- viewFor: what the screen shows --------------------------------------------------------------------

static State live(float pct, uint32_t atMs) {
  State s;
  s.connected = true;
  s.everConnected = true;
  s.hasValue = true;
  s.pct = pct;
  s.valueAtMs = atMs;
  return s;
}

void test_fresh_value_shows_its_dots_word_and_colour_quietly() {
  const View v = viewFor(live(72, 1000), 2000, false);
  TEST_ASSERT_EQUAL_INT(5, v.lit);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Colour::Blue), static_cast<int>(v.colour));
  TEST_ASSERT_EQUAL_STRING("To do", v.word);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::None), static_cast<int>(v.banner));
  TEST_ASSERT_FALSE(v.dim);
  TEST_ASSERT_FALSE(v.showAge);
  TEST_ASSERT_TRUE(v.litOn);
}

void test_simulated_mode_says_so_and_never_goes_stale() {
  State s = live(42, 0);
  s.simulated = true;
  s.connected = false;
  s.everConnected = false;
  const View v = viewFor(s, 120000, false);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::Simulated), static_cast<int>(v.banner));
  TEST_ASSERT_EQUAL_INT(3, v.lit);
  TEST_ASSERT_FALSE(v.dim);
  TEST_ASSERT_FALSE(v.showAge);
}

void test_boot_says_connecting_then_no_connection_after_the_grace_period() {
  State s;  // not connected, never connected, no value
  const View early = viewFor(s, kConnectGraceMs - 1, false);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::Connecting), static_cast<int>(early.banner));
  TEST_ASSERT_EQUAL_INT(0, early.lit);
  TEST_ASSERT_NULL(early.word);
  const View late = viewFor(s, kConnectGraceMs, false);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::NoConnection), static_cast<int>(late.banner));
}

void test_connected_without_a_value_waits_with_empty_slots() {
  State s;
  s.connected = true;
  s.everConnected = true;
  const View v = viewFor(s, 3000, false);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::Waiting), static_cast<int>(v.banner));
  TEST_ASSERT_EQUAL_INT(0, v.lit);
  TEST_ASSERT_NULL(v.word);
}

void test_lost_connection_flashes_no_connection_and_shows_the_data_age() {
  State s = live(72, 10000);
  s.connected = false;
  const View on = viewFor(s, 20000, false);  // 20 s: an even second, banner lit
  const View off = viewFor(s, 21000, false);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::NoConnection), static_cast<int>(on.banner));
  TEST_ASSERT_TRUE(on.bannerOn);
  TEST_ASSERT_FALSE(off.bannerOn);
  TEST_ASSERT_EQUAL_INT(5, on.lit);  // the last value stays
  TEST_ASSERT_TRUE(on.showAge);
  TEST_ASSERT_EQUAL_UINT32(10, on.ageS);
  TEST_ASSERT_FALSE(on.dim);  // not stale yet
}

void test_value_older_than_30_s_dims_and_shows_its_age() {
  const View fresh = viewFor(live(72, 0), kStaleMs, false);
  TEST_ASSERT_FALSE(fresh.dim);
  const View stale = viewFor(live(72, 0), kStaleMs + 1000, false);
  TEST_ASSERT_TRUE(stale.dim);
  TEST_ASSERT_TRUE(stale.showAge);
  TEST_ASSERT_EQUAL_UINT32(31, stale.ageS);
  TEST_ASSERT_EQUAL_INT(static_cast<int>(Banner::None), static_cast<int>(stale.banner));
}

void test_emergency_dot_flashes_at_1_hz_unless_stale() {
  TEST_ASSERT_TRUE(viewFor(live(8, 0), 1000, false).litOn);
  TEST_ASSERT_FALSE(viewFor(live(8, 0), 1500, false).litOn);
  TEST_ASSERT_TRUE(viewFor(live(8, 0), kStaleMs + 1500, false).litOn);
  TEST_ASSERT_TRUE(viewFor(live(25, 0), 1500, false).litOn);  // 2 dots never flash
}

void test_views_compare_by_what_is_drawn() {
  TEST_ASSERT_TRUE(viewFor(live(72, 0), 1000, false) == viewFor(live(75, 0), 2000, false));
  TEST_ASSERT_TRUE(viewFor(live(72, 0), 1000, false) != viewFor(live(60, 0), 1000, false));
}

void test_age_reads_in_seconds_minutes_or_hours() {
  char text[32];
  formatAge(47, text, sizeof text);
  TEST_ASSERT_EQUAL_STRING("data 47 s old", text);
  formatAge(60, text, sizeof text);
  TEST_ASSERT_EQUAL_STRING("data 1 min old", text);
  formatAge(3599, text, sizeof text);
  TEST_ASSERT_EQUAL_STRING("data 59 min old", text);
  formatAge(7200, text, sizeof text);
  TEST_ASSERT_EQUAL_STRING("data 2 h old", text);
}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_dots_for_each_band_edge);
  RUN_TEST(test_valid_pct_is_a_finite_number_from_0_to_100);
  RUN_TEST(test_levels_follow_the_alert_scale);
  RUN_TEST(test_four_dots_turn_yellow_only_when_configured);
  RUN_TEST(test_colours_map_to_the_dark_palette_in_rgb565);
  RUN_TEST(test_blend_mixes_a_colour_over_the_background);
  RUN_TEST(test_scenario_changes_dots_at_the_mockup_times);
  RUN_TEST(test_scenario_stays_in_range_and_loops_every_90_s);
  RUN_TEST(test_frame_with_the_topic_and_a_valid_pct_is_accepted);
  RUN_TEST(test_frame_for_another_device_is_skipped);
  RUN_TEST(test_frame_with_a_bad_pct_is_invalid);
  RUN_TEST(test_fresh_value_shows_its_dots_word_and_colour_quietly);
  RUN_TEST(test_simulated_mode_says_so_and_never_goes_stale);
  RUN_TEST(test_boot_says_connecting_then_no_connection_after_the_grace_period);
  RUN_TEST(test_connected_without_a_value_waits_with_empty_slots);
  RUN_TEST(test_lost_connection_flashes_no_connection_and_shows_the_data_age);
  RUN_TEST(test_value_older_than_30_s_dims_and_shows_its_age);
  RUN_TEST(test_emergency_dot_flashes_at_1_hz_unless_stale);
  RUN_TEST(test_views_compare_by_what_is_drawn);
  RUN_TEST(test_age_reads_in_seconds_minutes_or_hours);
  return UNITY_END();
}
