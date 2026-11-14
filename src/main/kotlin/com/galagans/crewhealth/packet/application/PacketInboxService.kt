package com.galagans.crewhealth.packet.application

import com.galagans.crewhealth.packet.domain.Packet
import com.galagans.crewhealth.packet.domain.PacketRepository
import org.springframework.stereotype.Service

@Service
class PacketInboxService(private val repository: PacketRepository) : PacketInbox {

    override fun receive(packet: Packet): String {
        repository.saveIfAbsent(packet)
        return packet.id
    }
}
