package com.galagans.crewhealth.checkin.application

import com.galagans.crewhealth.checkin.domain.CheckIn
import com.galagans.crewhealth.checkin.domain.CheckInRepository
import org.springframework.stereotype.Service

@Service
class CheckInSyncService(private val repository: CheckInRepository) : CheckInSync {

    override fun receive(checkIns: List<CheckIn>): List<String> =
        checkIns.map { checkIn ->
            repository.saveIfAbsent(checkIn)
            checkIn.id
        }
}
