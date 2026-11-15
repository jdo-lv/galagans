// The server side: Spring Boot's device relay (com.galagans.crewhealth.device) at /ws/devices, which fans every
// frame {"topic", "payload"} out to every other open socket and stores nothing. The display keeps its topic only.
#pragma once

constexpr char kDeviceLinkPath[] = "/ws/devices";
// Published once a second by the backend's health engine (src "backend-rules"): payload
// {id, t, pct, level, src, metrics}, pct from 0 to 100; only pct is read.
constexpr char kTopic[] = "crew/a1/dot-display";
