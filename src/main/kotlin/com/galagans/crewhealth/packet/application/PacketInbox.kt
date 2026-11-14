package com.galagans.crewhealth.packet.application

import com.galagans.crewhealth.packet.domain.Packet

/** Inbound port: receive a surgeon packet the crew app sent store-and-forward. */
interface PacketInbox {
    /** Idempotent: the first packet per id is kept. Returns the packet id. */
    fun receive(packet: Packet): String
}
