package com.galagans.crewhealth.health.application

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import java.time.Instant

private val mapper = jacksonObjectMapper()

/** A device link frame `{"topic", "payload"}` with a valid `id` and `src` unless `payload` overrides them. */
fun frame(topic: String, t: Any, vararg fields: Pair<String, Any?>): String =
    mapper.writeValueAsString(
        mapOf("topic" to topic, "payload" to mapOf("id" to "r-1", "t" to t.toString(), "src" to "synthetic") + fields),
    )

const val OXIMETER = "crew/a1/oximeter"
const val BRACELET = "crew/a1/wrist/hr"
const val BP = "crew/a1/bp"
const val THERMOMETER = "crew/a1/thermometer"
const val ENV = "module/hab/env"
const val DOSE = "module/hab/dose"

/** Nominal frames from every device at `t`: 10 indicators, all nominal. */
fun allNominal(t: Instant, skip: Set<String> = emptySet()): List<String> = listOf(
    frame(OXIMETER, t, "spo2_pct" to 97, "pulse_bpm" to 63),
    frame(BP, t, "systolic_mmhg" to 110, "diastolic_mmhg" to 69),
    frame(THERMOMETER, t, "temp_c" to 36.9),
    frame(ENV, t, "co2_mmhg_1h" to 2.3, "temp_c" to 22.3, "rh_pct" to 46),
    frame(DOSE, t, "dose_rate_msv_day" to 0.51, "dose_30d_mgy_eq" to 96.2),
).filter { f -> skip.none { f.contains("\"topic\":\"$it\"") } }
