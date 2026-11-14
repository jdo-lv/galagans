package com.galagans.crewhealth.packet.api

import com.galagans.crewhealth.packet.domain.Packet
import com.galagans.crewhealth.packet.domain.PacketItem
import java.time.Instant

data class PacketRequest(
    val id: String?,
    val builtAt: Instant?,
    val oneWayDelayMs: Long?,
    val note: String? = null,
    val items: List<PacketItemRequest>?,
) {
    fun toDomain() = Packet(id!!, builtAt!!, oneWayDelayMs!!, note.orEmpty(), items!!.map { it.toDomain() })
}

data class PacketItemRequest(
    val key: String?,
    val label: String?,
    val state: String?,
    val unit: String? = null,
    val value: Double? = null,
    val text: String? = null,
    val recordedAt: Instant? = null,
    val source: String? = null,
    val ruleId: String? = null,
    val tier: String? = null,
) {
    fun toDomain() = PacketItem(key!!, label!!, unit, state!!, value, text, recordedAt, source, ruleId, tier)
}

data class PacketResponse(val id: String)
