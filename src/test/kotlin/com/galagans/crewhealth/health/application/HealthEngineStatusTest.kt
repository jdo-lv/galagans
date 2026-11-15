package com.galagans.crewhealth.health.application

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.galagans.crewhealth.health.domain.Level
import com.galagans.crewhealth.health.domain.Level.CHECK
import com.galagans.crewhealth.health.domain.Level.EMERGENCY
import com.galagans.crewhealth.health.domain.Level.NOMINAL
import com.galagans.crewhealth.health.domain.Level.TREAT
import com.galagans.crewhealth.health.domain.Level.WATCH
import com.galagans.crewhealth.health.infrastructure.ClasspathRuleTable
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class HealthEngineStatusTest {
    private val t0 = Instant.parse("2026-11-14T09:31:06Z")
    private val engine = HealthEngine(ClasspathRuleTable()) { "6f1c-status" }

    private fun send(frames: List<String>, now: Instant = t0) = frames.forEach { engine.accept(it, now) }

    @Test
    fun `AC9 an indicator is fresh up to 30 s after its reading, and with none fresh there is no status`() {
        send(listOf(frame(THERMOMETER, t0, "temp_c" to 36.9)))

        assertEquals("nominal", engine.status(t0.plusSeconds(30))!!.metrics.single().level)
        assertNull(engine.status(t0.plusMillis(30_001)))
    }

    @Test
    fun `AC9 a stale indicator stays listed while another is fresh`() {
        send(listOf(frame(THERMOMETER, t0, "temp_c" to 36.9)))
        val later = t0.plusSeconds(600)
        send(listOf(frame(BRACELET, later, "hr_bpm" to 63)), later)

        assertEquals(listOf("heartRateBpm nominal", "bodyTempC stale"), engine.status(later)!!.metrics.map { "${it.indicator} ${it.level}" })
    }

    @Test
    fun `AC10 pct places the nominal share inside the worst level's band, half up`() {
        val cases = listOf(
            Triple(NOMINAL, 10, 10) to 100,
            Triple(CHECK, 8, 10) to 46,
            Triple(CHECK, 1, 2) to 42,
            Triple(WATCH, 9, 10) to 64,
            Triple(EMERGENCY, 9, 10) to 14,
            Triple(TREAT, 0, 1) to 17,
            Triple(CHECK, 9, 10) to 48,
            Triple(NOMINAL, 9, 10) to 98,
        )

        assertEquals(cases.map { it.second }, cases.map { (c, _) -> HealthEngine.pctFor(c.first, c.second, c.third) })
    }

    private fun levelAndPct() = engine.status(t0)!!.let { "${it.level} ${it.pct}" }

    @Test
    fun `AC10 all 10 metrics nominal is nominal 100`() {
        send(allNominal(t0))
        assertEquals("NOMINAL 100", levelAndPct())
    }

    @Test
    fun `AC10 SpO2 and heart rate at check with 8 of 10 nominal is check 46`() {
        send(allNominal(t0, skip = setOf(OXIMETER)) + frame(OXIMETER, t0, "spo2_pct" to 92, "pulse_bpm" to 104))
        assertEquals("CHECK 46", levelAndPct())
    }

    @Test
    fun `AC10 the oximeter alone at SpO2 92 is check 42`() {
        send(listOf(frame(OXIMETER, t0, "spo2_pct" to 92, "pulse_bpm" to 63)))
        assertEquals("CHECK 42", levelAndPct())
    }

    @Test
    fun `AC10 systolic 125 with 9 of 10 nominal is watch 64`() {
        send(allNominal(t0, skip = setOf(BP)) + frame(BP, t0, "systolic_mmhg" to 125, "diastolic_mmhg" to 69))
        assertEquals("WATCH 64", levelAndPct())
    }

    @Test
    fun `AC10 SpO2 89 with 9 of 10 nominal is emergency 14`() {
        send(allNominal(t0, skip = setOf(OXIMETER)) + frame(OXIMETER, t0, "spo2_pct" to 89, "pulse_bpm" to 63))
        assertEquals("EMERGENCY 14", levelAndPct())
    }

    @Test
    fun `AC10 a stopped oximeter at check plus 9 fresh nominal is check 48, its row stale at its last level`() {
        send(listOf(frame(OXIMETER, t0, "spo2_pct" to 92, "pulse_bpm" to 63)))
        val later = t0.plusSeconds(31)
        send(allNominal(later, skip = setOf(OXIMETER)) + frame(BRACELET, later, "hr_bpm" to 63), later)

        val status = assertNotNull(engine.status(later))
        assertEquals("CHECK 48", "${status.level} ${status.pct}")
        val spo2 = status.metrics.first()
        assertEquals(listOf("spo2Percent", "stale", "CHECK", "SPO-01"), listOf(spo2.indicator, spo2.level, "${spo2.lastLevel}", spo2.ruleId))
    }

    @Test
    fun `AC10 a stopped oximeter at nominal plus 9 fresh nominal is nominal 98`() {
        send(listOf(frame(OXIMETER, t0, "spo2_pct" to 97, "pulse_bpm" to 63)))
        val later = t0.plusSeconds(31)
        send(allNominal(later, skip = setOf(OXIMETER)) + frame(BRACELET, later, "hr_bpm" to 63), later)

        assertEquals("NOMINAL 98", engine.status(later)!!.let { "${it.level} ${it.pct}" })
    }

    @Test
    fun `AC11 the payload has id, t, integer pct, level, src and the metrics in indicator order`() {
        send(allNominal(t0, skip = setOf(OXIMETER)).reversed() + frame(OXIMETER, "2026-11-14T11:31:06+02:00", "spo2_pct" to 92, "pulse_bpm" to 104))

        val json = jacksonObjectMapper().readTree(jacksonObjectMapper().writeValueAsString(engine.status(t0.plusSeconds(4))))

        assertEquals("6f1c-status", json["id"].asText())
        assertEquals("2026-11-14T09:31:10Z", json["t"].asText())
        assertEquals("46", json["pct"].toString())
        assertEquals("check", json["level"].asText())
        assertEquals("backend-rules", json["src"].asText())
        assertEquals(
            listOf(
                "spo2Percent", "heartRateBpm", "systolicMmHg", "diastolicMmHg", "bodyTempC",
                "cabinCo2MmHg", "cabinTempC", "cabinHumidityPct", "doseRateMsvDay", "bfoDose30dMgyEq",
            ),
            json["metrics"].map { it["indicator"].asText() },
        )
        assertEquals(
            """{"indicator":"spo2Percent","label":"SpO₂","value":92,"unit":"%","level":"check","ruleId":"SPO-01",""" +
                """"recordedAt":"2026-11-14T09:31:06Z","src":"oximeter · synthetic"}""",
            json["metrics"][0].toString(),
        )
        assertEquals(
            """{"indicator":"cabinHumidityPct","label":"Cabin humidity","value":46,"unit":"% RH","level":"nominal",""" +
                """"recordedAt":"2026-11-14T09:31:06Z","src":"environment node · synthetic"}""",
            json["metrics"][7].toString(),
        )
        assertEquals("36.9", json["metrics"][4]["value"].toString())
    }

    @Test
    fun `AC11 a stale entry has level stale and its last level`() {
        send(listOf(frame(THERMOMETER, t0, "temp_c" to 38.2)))
        val later = t0.plusSeconds(31)
        send(listOf(frame(BRACELET, later, "hr_bpm" to 63)), later)

        val json = jacksonObjectMapper().readTree(jacksonObjectMapper().writeValueAsString(engine.status(later)))

        assertEquals(
            """{"indicator":"bodyTempC","label":"Temperature","value":38.2,"unit":"°C","level":"stale","lastLevel":"check",""" +
                """"ruleId":"TMP-01","recordedAt":"2026-11-14T09:31:06Z","src":"thermometer · synthetic"}""",
            json["metrics"][1].toString(),
        )
        assertEquals(Level.CHECK, engine.status(later)!!.level)
    }
}
