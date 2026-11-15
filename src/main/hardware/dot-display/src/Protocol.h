// The server side: Spring Boot's device relay (com.galagans.crewhealth.device) at /ws/devices, which fans every
// frame {"topic", "payload"} out to every other open socket and stores nothing. The display keeps its topic only.
#pragma once

constexpr char kDeviceLinkPath[] = "/ws/devices";
// Placeholder until the backend publishes the value: payload {id, t, pct, src}, pct from 0 to 100.
constexpr char kTopic[] = "crew/a1/dot-display";
