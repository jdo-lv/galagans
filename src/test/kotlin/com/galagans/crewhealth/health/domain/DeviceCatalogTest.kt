package com.galagans.crewhealth.health.domain

import kotlin.test.Test
import kotlin.test.assertEquals

class DeviceCatalogTest {
    private fun number(value: Double) = if (value % 1.0 == 0.0) value.toLong().toString() else value.toString()

    @Test
    fun `AC3 lists the 12 fields of devices ts DEVICES (same literal list as devices test ts)`() {
        val lines = DeviceCatalog.devices.flatMap { device ->
            device.fields.map {
                "${device.topic} · ${device.label} · ${it.key} · ${it.indicator} · ${number(it.validMin)} · ${number(it.validMax)} · ${it.required}"
            }
        }

        assertEquals(
            listOf(
                "crew/a1/oximeter · oximeter · spo2_pct · spo2Percent · 50 · 100 · true",
                "crew/a1/oximeter · oximeter · pulse_bpm · heartRateBpm · 20 · 250 · false",
                "crew/a1/wrist/hr · bracelet · hr_bpm · heartRateBpm · 20 · 250 · true",
                "crew/a1/bp · BP cuff · systolic_mmhg · systolicMmHg · 50 · 250 · true",
                "crew/a1/bp · BP cuff · diastolic_mmhg · diastolicMmHg · 30 · 150 · true",
                "crew/a1/bp · BP cuff · pulse_bpm · heartRateBpm · 20 · 250 · false",
                "crew/a1/thermometer · thermometer · temp_c · bodyTempC · 30 · 43 · true",
                "module/hab/env · environment node · co2_mmhg_1h · cabinCo2MmHg · 0 · 20 · true",
                "module/hab/env · environment node · temp_c · cabinTempC · 0 · 50 · false",
                "module/hab/env · environment node · rh_pct · cabinHumidityPct · 0 · 100 · false",
                "module/hab/dose · dosimeter · dose_rate_msv_day · doseRateMsvDay · 0 · 100 · true",
                "module/hab/dose · dosimeter · dose_30d_mgy_eq · bfoDose30dMgyEq · 0 · 2000 · true",
            ),
            lines,
        )
    }
}
