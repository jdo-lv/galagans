package com.galagans.crewhealth.health.application

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.galagans.crewhealth.health.domain.Device
import com.galagans.crewhealth.health.domain.DeviceCatalog
import com.galagans.crewhealth.health.domain.HealthStatus
import com.galagans.crewhealth.health.domain.Level
import com.galagans.crewhealth.health.domain.MetricStatus
import com.galagans.crewhealth.health.domain.RuleRow
import com.galagans.crewhealth.health.domain.RuleTable
import java.time.Duration
import java.time.Instant
import java.time.OffsetDateTime
import java.time.format.DateTimeParseException
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Judges every device reading on the relay with the crew app's rule rows and sums them up for the dot display.
 * A deliberate exception to "no crew-facing rules in the backend": the display runs without the tablet.
 */
class HealthEngine(
    rules: RuleTable,
    private val newId: () -> String = { UUID.randomUUID().toString() },
) {
    private class Reading(val value: Number, val recordedAt: Instant, val src: String, val level: Level, val ruleId: String?)

    private val mapper = ObjectMapper()
    private val rows: List<RuleRow> = rules.rows().filter { it.below != null || it.above != null }
    private val firstRows: Map<String, RuleRow> = rules.rows().groupBy { it.indicator }.mapValues { it.value.first() }
    private val latest = ConcurrentHashMap<String, Reading>()

    fun levelOf(indicator: String, value: Double): Level = judge(indicator, value)?.level ?: Level.NOMINAL

    /** Most severe matching row; null when nominal. */
    private fun judge(indicator: String, value: Double): RuleRow? = rows
        .filter { it.indicator == indicator && (it.below?.let { b -> value < b } == true || it.above?.let { a -> value > a } == true) }
        .maxByOrNull { it.level }

    /** Keeps the frame's readings when it is a valid device frame; anything else changes nothing. */
    fun accept(frame: String, now: Instant) {
        val envelope = try {
            mapper.readTree(frame)
        } catch (_: Exception) {
            return
        }
        val device = envelope?.path("topic")?.takeIf { it.isTextual }?.let { DeviceCatalog.byTopic(it.asText()) } ?: return
        readingsOf(device, envelope.path("payload"), now)?.forEach { (indicator, reading) ->
            latest.merge(indicator, reading) { old, new -> if (wins(new, old)) new else old }
        }
    }

    private fun wins(new: Reading, old: Reading): Boolean =
        new.recordedAt.isAfter(old.recordedAt) || (new.recordedAt == old.recordedAt && new.level > old.level)

    private fun readingsOf(device: Device, payload: JsonNode, now: Instant): List<Pair<String, Reading>>? {
        val id = payload.path("id")
        if (!id.isTextual || id.asText().isEmpty()) return null
        val recordedAt = timeOf(payload.path("t")) ?: return null
        if (recordedAt.isAfter(now.plus(MAX_AHEAD))) return null
        val src = payload.path("src").takeIf { it.isTextual }?.asText()?.takeIf { it in SOURCES } ?: return null

        val readings = mutableListOf<Pair<String, Reading>>()
        for (field in device.fields) {
            val node = payload.path(field.key)
            val value = node.takeIf { it.isNumber }?.numberValue()
            if (value == null || value.toDouble() !in field.validMin..field.validMax) {
                if (field.required) return null
                continue
            }
            val row = judge(field.indicator, value.toDouble())
            readings += field.indicator to Reading(value, recordedAt, "${device.label} · $src", row?.level ?: Level.NOMINAL, row?.id)
        }
        return readings
    }

    private fun timeOf(node: JsonNode): Instant? {
        if (!node.isTextual || !ISO_TIME.matches(node.asText())) return null
        return try {
            OffsetDateTime.parse(node.asText()).toInstant()
        } catch (_: DateTimeParseException) {
            null
        }
    }

    /** The display's payload, or null when no indicator has a fresh reading. */
    fun status(now: Instant): HealthStatus? {
        val readings = DeviceCatalog.indicators.mapNotNull { indicator -> latest[indicator]?.let { indicator to it } }
        val fresh = readings.filter { (_, r) -> !r.recordedAt.isBefore(now.minus(FRESH)) }.map { it.first }.toSet()
        if (fresh.isEmpty()) return null

        val worst = readings.maxOf { it.second.level }
        val nominal = readings.count { (indicator, r) -> indicator in fresh && r.level == Level.NOMINAL }
        val metrics = readings.map { (indicator, r) ->
            val row = firstRows.getValue(indicator)
            val isFresh = indicator in fresh
            MetricStatus(
                indicator = indicator,
                label = row.label,
                value = r.value,
                unit = row.unit,
                level = if (isFresh) r.level.word else STALE,
                lastLevel = if (isFresh) null else r.level,
                ruleId = r.ruleId,
                recordedAt = r.recordedAt.toString(),
                src = r.src,
            )
        }
        return HealthStatus(newId(), now.toString(), pctFor(worst, nominal, readings.size), worst, PUBLISHER, metrics)
    }

    companion object {
        const val PUBLISHER = "backend-rules"
        private const val STALE = "stale"
        private val SOURCES = setOf("synthetic", "replay", "proxy")
        private val ISO_TIME = Regex("""^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$""")

        /** Tolerated clock skew between a device and the server, as the tablet's gateway. */
        private val MAX_AHEAD = Duration.ofSeconds(60)

        /** The dot display's STALE_MS. */
        private val FRESH = Duration.ofSeconds(30)

        /** Each level's pct range, so the display's dots (6, 4, 3, 2, 1) always match the worst level. */
        private val BANDS = mapOf(
            Level.NOMINAL to (84 to 100),
            Level.WATCH to (50 to 66),
            Level.CHECK to (34 to 49),
            Level.TREAT to (17 to 33),
            Level.EMERGENCY to (0 to 16),
        )

        /** Team heuristic: the worst level picks the band, the nominal share places it in the band (half up). */
        fun pctFor(worst: Level, nominal: Int, counted: Int): Int {
            val (min, max) = BANDS.getValue(worst)
            return min + (2 * (max - min) * nominal + counted) / (2 * counted)
        }
    }
}
