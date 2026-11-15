package com.galagans.crewhealth.health.domain

/** One payload field: its key, the indicator it reports and its input limits (not medical thresholds). */
data class DeviceField(val key: String, val indicator: String, val validMin: Double, val validMax: Double, val required: Boolean)

data class Device(val topic: String, val label: String, val fields: List<DeviceField>)

/** The devices the health engine reads; mirrors `src/main/frontend/src/domain/devices.ts` `DEVICES`, both pinned by tests. */
object DeviceCatalog {
    val devices = listOf(
        Device(
            "crew/a1/oximeter", "oximeter",
            listOf(
                DeviceField("spo2_pct", "spo2Percent", 50.0, 100.0, true),
                DeviceField("pulse_bpm", "heartRateBpm", 20.0, 250.0, false),
            ),
        ),
        Device("crew/a1/wrist/hr", "bracelet", listOf(DeviceField("hr_bpm", "heartRateBpm", 20.0, 250.0, true))),
        Device(
            "crew/a1/bp", "BP cuff",
            listOf(
                DeviceField("systolic_mmhg", "systolicMmHg", 50.0, 250.0, true),
                DeviceField("diastolic_mmhg", "diastolicMmHg", 30.0, 150.0, true),
                DeviceField("pulse_bpm", "heartRateBpm", 20.0, 250.0, false),
            ),
        ),
        Device("crew/a1/thermometer", "thermometer", listOf(DeviceField("temp_c", "bodyTempC", 30.0, 43.0, true))),
        Device(
            "module/hab/env", "environment node",
            listOf(
                DeviceField("co2_mmhg_1h", "cabinCo2MmHg", 0.0, 20.0, true),
                DeviceField("temp_c", "cabinTempC", 0.0, 50.0, false),
                DeviceField("rh_pct", "cabinHumidityPct", 0.0, 100.0, false),
            ),
        ),
        Device(
            "module/hab/dose", "dosimeter",
            listOf(
                DeviceField("dose_rate_msv_day", "doseRateMsvDay", 0.0, 100.0, true),
                DeviceField("dose_30d_mgy_eq", "bfoDose30dMgyEq", 0.0, 2000.0, true),
            ),
        ),
    )

    /** Every indicator once, in device order: the order of the status metrics. */
    val indicators: List<String> = devices.flatMap { device -> device.fields.map { it.indicator } }.distinct()

    fun byTopic(topic: String): Device? = devices.firstOrNull { it.topic == topic }
}
