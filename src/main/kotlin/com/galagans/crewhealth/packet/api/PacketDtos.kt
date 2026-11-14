package com.galagans.crewhealth.packet.api

import com.fasterxml.jackson.annotation.JsonSetter
import com.fasterxml.jackson.annotation.Nulls
import com.galagans.crewhealth.packet.domain.Packet
import com.galagans.crewhealth.packet.domain.PacketItem
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

/**
 * Required fields are nullable so a missing one is a bean-validation 400 whatever Jackson does with
 * missing Kotlin primitives; `toDomain()` runs only after validation. Unknown fields are ignored.
 */
data class PacketRequest(
    @field:NotBlank val id: String?,
    @field:NotNull val builtAt: Instant?,
    @field:NotNull @field:Min(0) val oneWayDelayMs: Long?,
    @field:Size(max = 500) val note: String? = null,
    // contentNulls: jackson-module-kotlin doesn't null-check list elements, so [null] would reach toDomain() as a 500.
    @field:NotNull @field:Size(max = 20) @field:Valid @JsonSetter(contentNulls = Nulls.FAIL)
    val items: List<PacketItemRequest>?,
) {
    fun toDomain() = Packet(
        id = id!!,
        builtAt = builtAt!!,
        oneWayDelayMs = oneWayDelayMs!!,
        note = if (note.isNullOrBlank()) "" else note,
        items = items!!.map { it.toDomain() },
    )
}

data class PacketItemRequest(
    @field:NotBlank val key: String?,
    @field:NotBlank val label: String?,
    @field:NotBlank val state: String?,
    val unit: String? = null,
    val value: Double? = null,
    val text: String? = null,
    val recordedAt: Instant? = null,
    @field:Pattern(regexp = "(?s).*\\S.*") val source: String? = null,
    val ruleId: String? = null,
    val tier: String? = null,
) {
    fun toDomain() = PacketItem(key!!, label!!, unit, state!!, value, text, recordedAt, source, ruleId, tier)
}

data class PacketResponse(val id: String)
