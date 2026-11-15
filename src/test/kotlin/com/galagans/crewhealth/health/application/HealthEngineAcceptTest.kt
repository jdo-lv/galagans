package com.galagans.crewhealth.health.application

import com.galagans.crewhealth.health.domain.MetricStatus
import com.galagans.crewhealth.health.infrastructure.ClasspathRuleTable
import java.time.Instant
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class HealthEngineAcceptTest {
    private val now = Instant.parse("2026-11-14T09:31:10Z")
    private val engine = HealthEngine(ClasspathRuleTable())

    private fun metrics(): List<MetricStatus> = engine.status(now)?.metrics.orEmpty()
    private fun metric(indicator: String) = metrics().single { it.indicator == indicator }
    private fun summary() = metrics().map { "${it.indicator} ${it.value} ${it.level} ${it.src}" }

    @Test
    fun `AC5 keeps value, time with its offset applied and the device source of each field`() {
        engine.accept(frame(OXIMETER, "2026-11-14T11:31:08+02:00", "spo2_pct" to 92, "pulse_bpm" to 63), now)

        assertEquals(listOf("spo2Percent 92 check oximeter · synthetic", "heartRateBpm 63 nominal oximeter · synthetic"), summary())
        assertEquals("2026-11-14T09:31:08Z", metric("spo2Percent").recordedAt)
    }

    @Test
    fun `AC5 accepts fractional seconds, replay and proxy sources, and a time up to 60 s ahead`() {
        engine.accept(frame(THERMOMETER, "2026-11-14T09:32:10.000Z", "temp_c" to 36.9, "src" to "replay"), now)
        engine.accept(frame(DOSE, "2026-11-14T09:31:09.5Z", "dose_rate_msv_day" to 0.5, "dose_30d_mgy_eq" to 95, "src" to "proxy"), now)

        assertEquals(
            listOf("bodyTempC 36.9 nominal thermometer · replay", "doseRateMsvDay 0.5 nominal dosimeter · proxy", "bfoDose30dMgyEq 95 nominal dosimeter · proxy"),
            summary(),
        )
    }

    @Test
    fun `AC5 drops a frame with a bad id, t or src`() {
        val t = "2026-11-14T09:31:08Z"
        listOf(
            frame(THERMOMETER, t, "temp_c" to 36.9, "id" to ""),
            frame(THERMOMETER, t, "temp_c" to 36.9, "id" to 7),
            frame(THERMOMETER, t, "temp_c" to 36.9, "id" to null),
            frame(THERMOMETER, "2026-11-14 09:31:08Z", "temp_c" to 36.9),
            frame(THERMOMETER, "2026-11-14T09:31:08", "temp_c" to 36.9),
            frame(THERMOMETER, "2026-13-14T09:31:08Z", "temp_c" to 36.9),
            frame(THERMOMETER, "2026-11-14T09:32:10.001Z", "temp_c" to 36.9),
            frame(THERMOMETER, t, "temp_c" to 36.9, "src" to "manual"),
            frame(THERMOMETER, t, "temp_c" to 36.9, "src" to null),
        ).forEach { engine.accept(it, now) }

        assertNull(engine.status(now))
    }

    @Test
    fun `AC5 a missing or failing required field drops the frame, an optional one is skipped`() {
        val t = "2026-11-14T09:31:08Z"
        listOf(
            frame(OXIMETER, t, "spo2_pct" to "92", "pulse_bpm" to 63),
            frame(OXIMETER, t, "spo2_pct" to true, "pulse_bpm" to 63),
            frame(OXIMETER, t, "spo2_pct" to 49, "pulse_bpm" to 63),
            frame(OXIMETER, t, "spo2_pct" to 101, "pulse_bpm" to 63),
            frame(OXIMETER, t, "pulse_bpm" to 63),
        ).forEach { engine.accept(it, now) }
        assertNull(engine.status(now))

        engine.accept(frame(OXIMETER, t, "spo2_pct" to 97, "pulse_bpm" to "63"), now)
        engine.accept(frame(ENV, t, "co2_mmhg_1h" to 2.3, "temp_c" to 51, "rh_pct" to false), now)

        assertEquals(listOf("spo2Percent 97 nominal oximeter · synthetic", "cabinCo2MmHg 2.3 nominal environment node · synthetic"), summary())
    }

    @Test
    fun `AC6 frames that aren't JSON, have another topic or fail the checks change nothing and throw nothing`() {
        val t = "2026-11-14T09:31:08Z"
        listOf(
            "not json",
            "",
            "42",
            "[1,2]",
            "null",
            """{"topic":"crew/a1/oximeter"}""",
            """{"topic":"crew/a1/oximeter","payload":[1]}""",
            """{"topic":7,"payload":{}}""",
            frame("crew/a1/dot-display", t, "pct" to 46, "spo2_pct" to 92),
            frame("crew/a1/glucometer", t, "spo2_pct" to 92),
            frame(OXIMETER, t, "spo2_pct" to 92).dropLast(2),
        ).forEach { engine.accept(it, now) }

        assertNull(engine.status(now))
    }

    @Test
    fun `AC7 the latest t wins per indicator, whichever device sent it`() {
        engine.accept(frame(BRACELET, "2026-11-14T09:31:07Z", "hr_bpm" to 105), now)
        engine.accept(frame(OXIMETER, "2026-11-14T09:31:08Z", "spo2_pct" to 97, "pulse_bpm" to 63), now)

        assertEquals("heartRateBpm 63 nominal oximeter · synthetic", summary()[1])
        assertNull(metric("heartRateBpm").ruleId)
    }

    @Test
    fun `AC7 times compare as instants, not strings`() {
        engine.accept(frame(BRACELET, "2026-11-14T09:31:07Z", "hr_bpm" to 105), now)
        engine.accept(frame(OXIMETER, "2026-11-14T09:31:08+02:00", "spo2_pct" to 97, "pulse_bpm" to 63), now)

        assertEquals("heartRateBpm 105 check bracelet · synthetic", summary()[1])
    }

    @Test
    fun `AC7 on equal instants the more severe level wins, in either order`() {
        engine.accept(frame(BRACELET, "2026-11-14T09:31:07Z", "hr_bpm" to 105), now)
        engine.accept(frame(OXIMETER, "2026-11-14T11:31:07+02:00", "spo2_pct" to 97, "pulse_bpm" to 63), now)
        assertEquals("heartRateBpm 105 check bracelet · synthetic", summary()[1])

        val other = HealthEngine(ClasspathRuleTable())
        other.accept(frame(OXIMETER, "2026-11-14T09:31:07Z", "spo2_pct" to 97, "pulse_bpm" to 63), now)
        other.accept(frame(BRACELET, "2026-11-14T09:31:07Z", "hr_bpm" to 105), now)
        assertEquals("check", other.status(now)!!.metrics.single { it.indicator == "heartRateBpm" }.level)
    }

    @Test
    fun `AC8 accept from 4 threads while status runs throws nothing`() {
        val pool = Executors.newFixedThreadPool(5)
        val writers = (1..4).map { n ->
            pool.submit {
                repeat(1_000) { i ->
                    val t = now.minusSeconds(((i * n) % 20).toLong())
                    engine.accept(frame(BRACELET, t, "hr_bpm" to 60 + (i % 50), "id" to "$n-$i"), now)
                    engine.accept(frame(OXIMETER, t, "spo2_pct" to 90 + (i % 10), "pulse_bpm" to 63), now)
                }
            }
        }
        val reader = pool.submit<Int> {
            var calls = 0
            while (writers.any { !it.isDone }) {
                engine.status(now)
                calls++
            }
            calls
        }

        writers.forEach { it.get(30, TimeUnit.SECONDS) }
        assertTrue(reader.get(30, TimeUnit.SECONDS) > 0)
        pool.shutdown()
        assertEquals(listOf("spo2Percent", "heartRateBpm"), metrics().map { it.indicator })
    }
}
