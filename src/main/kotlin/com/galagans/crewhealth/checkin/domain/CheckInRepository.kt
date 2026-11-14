package com.galagans.crewhealth.checkin.domain

interface CheckInRepository {
    /** Stores the check-in unless its id is already known. Returns true when it was new. */
    fun saveIfAbsent(checkIn: CheckIn): Boolean
}
