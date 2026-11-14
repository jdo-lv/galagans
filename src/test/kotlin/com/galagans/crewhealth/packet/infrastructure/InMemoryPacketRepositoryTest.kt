package com.galagans.crewhealth.packet.infrastructure

import com.galagans.crewhealth.packet.domain.Packet
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class InMemoryPacketRepositoryTest {
    private val repository = InMemoryPacketRepository()
    private val packet = Packet("p-1", Instant.parse("2026-11-14T07:31:00Z"), 845000, "Slept badly.", emptyList())

    @Test
    fun `AC9 saves a new packet`() {
        assertTrue(repository.saveIfAbsent(packet))
    }

    @Test
    fun `AC9 ignores a packet with a known id`() {
        repository.saveIfAbsent(packet)

        assertFalse(repository.saveIfAbsent(packet.copy(note = "Headache since 06:00.")))
    }
}
