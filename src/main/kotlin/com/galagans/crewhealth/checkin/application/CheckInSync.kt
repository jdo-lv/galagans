package com.galagans.crewhealth.checkin.application

import com.galagans.crewhealth.checkin.domain.CheckIn

/** Inbound port: receive check-ins recorded offline on a client. */
interface CheckInSync {
    /** Idempotent. Returns the ids the server now holds, new or already known. */
    fun receive(checkIns: List<CheckIn>): List<String>
}
