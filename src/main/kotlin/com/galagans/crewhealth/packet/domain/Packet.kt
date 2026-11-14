package com.galagans.crewhealth.packet.domain

import java.time.Instant

/** A surgeon packet built on board and sent store-and-forward to the ground. */
data class Packet(
    val id: String,
    val builtAt: Instant,
    val oneWayDelayMs: Long,
    val note: String,
    val items: List<PacketItem>,
)

/** One reading or status line of a packet, as the crew app showed it; `state` and `source` are free strings. */
data class PacketItem(
    val key: String,
    val label: String,
    val unit: String?,
    val state: String,
    val value: Double?,
    val text: String?,
    val recordedAt: Instant?,
    val source: String?,
    val ruleId: String?,
    val tier: String?,
)
