package com.galagans.crewhealth.health.domain

/** One `rules.json` row; a row with neither `below` nor `above` (baseline-relative) never matches a device value. */
data class RuleRow(
    val id: String,
    val indicator: String,
    val label: String,
    val unit: String,
    val below: Double?,
    val above: Double?,
    val level: Level,
)

/** Where the rule rows come from. */
interface RuleTable {
    fun rows(): List<RuleRow>
}
