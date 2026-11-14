package com.galagans.crewhealth.checkin.infrastructure

import com.galagans.crewhealth.checkin.domain.CheckIn
import com.galagans.crewhealth.checkin.domain.CheckInRepository
import org.springframework.stereotype.Repository
import java.util.concurrent.ConcurrentHashMap

@Repository
class InMemoryCheckInRepository : CheckInRepository {
    private val store = ConcurrentHashMap<String, CheckIn>()

    override fun saveIfAbsent(checkIn: CheckIn): Boolean = store.putIfAbsent(checkIn.id, checkIn) == null
}
