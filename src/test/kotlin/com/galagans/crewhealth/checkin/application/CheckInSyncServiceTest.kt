package com.galagans.crewhealth.checkin.application

import com.galagans.crewhealth.checkin.domain.CheckIn
import com.galagans.crewhealth.checkin.domain.CheckInRepository
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals

class CheckInSyncServiceTest {
    private val saved = mutableListOf<CheckIn>()
    private val repository = object : CheckInRepository {
        override fun saveIfAbsent(checkIn: CheckIn): Boolean = saved.add(checkIn)
    }
    private val service = CheckInSyncService(repository)

    private fun checkIn(id: String) = CheckIn(id, Instant.parse("2026-11-14T08:00:00Z"), null, null, null, null, emptyList())

    @Test
    fun `returns the id of every received check-in`() {
        val ids = service.receive(listOf(checkIn("a"), checkIn("b")))

        assertEquals(listOf("a", "b"), ids)
        assertEquals(2, saved.size)
    }

    @Test
    fun `accepts an empty batch`() {
        assertEquals(emptyList(), service.receive(emptyList()))
    }
}
