package com.galagans.crewhealth.health.domain

import com.fasterxml.jackson.annotation.JsonInclude

/** The dot display's payload on `crew/a1/dot-display`. */
data class HealthStatus(
    val id: String,
    val t: String,
    val pct: Int,
    val level: Level,
    val src: String,
    val metrics: List<MetricStatus>,
)

/** One indicator's latest reading; `level` is a level word or `stale`, and `lastLevel` is set only when stale. */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class MetricStatus(
    val indicator: String,
    val label: String,
    val value: Number,
    val unit: String,
    val level: String,
    val lastLevel: Level?,
    val ruleId: String?,
    val recordedAt: String,
    val src: String,
)
