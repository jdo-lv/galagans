package com.galagans.crewhealth.packet.application

import com.galagans.crewhealth.packet.domain.Packet
import com.galagans.crewhealth.packet.domain.PacketRepository
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals

class PacketInboxServiceTest {
    private var calls = 0
    private val repository = object : PacketRepository {
        override fun saveIfAbsent(packet: Packet): Boolean = ++calls == 1
    }
    private val service = PacketInboxService(repository)

    private val packet = Packet("p-1", Instant.parse("2026-11-14T07:31:00Z"), 845000, "", emptyList())

    @Test
    fun `AC8 receiving the same packet twice returns its id both times`() {
        val first = service.receive(packet)
        val second = service.receive(packet)

        assertEquals(listOf("p-1", "p-1"), listOf(first, second))
        assertEquals(2, calls)
    }
}
