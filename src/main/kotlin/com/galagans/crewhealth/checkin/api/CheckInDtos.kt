package com.galagans.crewhealth.checkin.api

import com.galagans.crewhealth.checkin.domain.CheckIn
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class CheckInRequest(
    @field:NotBlank val id: String,
    val recordedAt: Instant,
    @field:Min(20) @field:Max(250) val heartRateBpm: Int? = null,
    @field:Min(50) @field:Max(100) val spo2Percent: Int? = null,
    @field:DecimalMin("0.0") @field:DecimalMax("24.0") val sleepHours: Double? = null,
    @field:Min(1) @field:Max(5) val mood: Int? = null,
    val symptoms: List<String> = emptyList(),
) {
    fun toDomain() = CheckIn(id, recordedAt, heartRateBpm, spo2Percent, sleepHours, mood, symptoms)
}

data class SyncRequest(@field:Valid @field:Size(max = 500) val checkIns: List<CheckInRequest>)

data class SyncResponse(val acceptedIds: List<String>)
