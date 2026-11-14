package com.galagans.crewhealth.packet.domain

interface PacketRepository {
    /** Stores the packet unless its id is already known. Returns true when it was new. */
    fun saveIfAbsent(packet: Packet): Boolean
}
