package com.galagans.crewhealth.packet.infrastructure

import com.galagans.crewhealth.packet.domain.Packet
import com.galagans.crewhealth.packet.domain.PacketRepository
import org.springframework.stereotype.Repository
import java.util.concurrent.ConcurrentHashMap

@Repository
class InMemoryPacketRepository : PacketRepository {
    private val store = ConcurrentHashMap<String, Packet>()

    override fun saveIfAbsent(packet: Packet): Boolean = store.putIfAbsent(packet.id, packet) == null
}
