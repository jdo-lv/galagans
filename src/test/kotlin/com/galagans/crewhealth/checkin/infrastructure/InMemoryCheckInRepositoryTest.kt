package com.galagans.crewhealth.checkin.infrastructure

import com.galagans.crewhealth.checkin.domain.CheckIn
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class InMemoryCheckInRepositoryTest {
    private val repository = InMemoryCheckInRepository()
    private val checkIn = CheckIn("a", Instant.parse("2026-11-14T08:00:00Z"), 62, 98, 7.5, 4, emptyList())

    @Test
    fun `saves a new check-in`() {
        assertTrue(repository.saveIfAbsent(checkIn))
    }

    @Test
    fun `ignores a check-in with a known id`() {
        repository.saveIfAbsent(checkIn)

        assertFalse(repository.saveIfAbsent(checkIn.copy(heartRateBpm = 70)))
    }
}
