package com.galagans.crewhealth.health.application

import com.galagans.crewhealth.health.domain.Level
import com.galagans.crewhealth.health.domain.Level.CHECK
import com.galagans.crewhealth.health.domain.Level.EMERGENCY
import com.galagans.crewhealth.health.domain.Level.NOMINAL
import com.galagans.crewhealth.health.domain.Level.TREAT
import com.galagans.crewhealth.health.domain.Level.WATCH
import com.galagans.crewhealth.health.infrastructure.ClasspathRuleTable
import kotlin.test.Test
import kotlin.test.assertEquals

class HealthEngineLevelTest {
    private val engine = HealthEngine(ClasspathRuleTable())

    private val cases: List<Triple<String, Double, Level>> = listOf(
        Triple("spo2Percent", 94.0, NOMINAL), Triple("spo2Percent", 93.0, CHECK), Triple("spo2Percent", 89.0, EMERGENCY),
        Triple("heartRateBpm", 100.0, NOMINAL), Triple("heartRateBpm", 101.0, CHECK), Triple("heartRateBpm", 39.0, CHECK),
        Triple("systolicMmHg", 119.0, NOMINAL), Triple("systolicMmHg", 120.0, WATCH), Triple("systolicMmHg", 130.0, CHECK),
        Triple("systolicMmHg", 140.0, TREAT), Triple("systolicMmHg", 180.0, EMERGENCY),
        Triple("diastolicMmHg", 79.0, NOMINAL), Triple("diastolicMmHg", 80.0, CHECK), Triple("diastolicMmHg", 90.0, TREAT),
        Triple("diastolicMmHg", 120.0, EMERGENCY),
        Triple("bodyTempC", 37.9, NOMINAL), Triple("bodyTempC", 38.0, CHECK),
        Triple("cabinCo2MmHg", 2.5, NOMINAL), Triple("cabinCo2MmHg", 2.6, WATCH), Triple("cabinCo2MmHg", 3.1, CHECK),
        Triple("cabinTempC", 17.9, CHECK), Triple("cabinTempC", 22.0, NOMINAL), Triple("cabinTempC", 27.1, CHECK),
        Triple("cabinHumidityPct", 24.0, CHECK), Triple("cabinHumidityPct", 45.0, NOMINAL), Triple("cabinHumidityPct", 76.0, CHECK),
        Triple("doseRateMsvDay", 0.9, NOMINAL), Triple("doseRateMsvDay", 0.91, CHECK),
        Triple("bfoDose30dMgyEq", 125.0, NOMINAL), Triple("bfoDose30dMgyEq", 125.1, CHECK), Triple("bfoDose30dMgyEq", 250.1, EMERGENCY),
    )

    @Test
    fun `AC4 each indicator takes the most severe level whose strict limit it crosses, else nominal`() {
        val actual = cases.map { (indicator, value, _) -> "$indicator $value ${engine.levelOf(indicator, value)}" }

        assertEquals(cases.map { (indicator, value, level) -> "$indicator $value $level" }, actual)
    }

    @Test
    fun `AC4 an indicator without a usable row is nominal`() {
        assertEquals(NOMINAL, engine.levelOf("pvtMedianMs", 900.0))
    }
}
