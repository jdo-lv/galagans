package com.galagans.crewhealth.checkin.domain

import java.time.Instant

data class CheckIn(
    val id: String,
    val recordedAt: Instant,
    val heartRateBpm: Int?,
    val spo2Percent: Int?,
    val sleepHours: Double?,
    val mood: Int?,
    val symptoms: List<String>,
)
