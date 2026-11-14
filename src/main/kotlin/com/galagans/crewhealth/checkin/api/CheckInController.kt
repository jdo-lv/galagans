package com.galagans.crewhealth.checkin.api

import com.galagans.crewhealth.checkin.application.CheckInSync
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/checkins")
class CheckInController(private val sync: CheckInSync) {

    @PostMapping("/sync")
    fun sync(@Valid @RequestBody request: SyncRequest): SyncResponse =
        SyncResponse(sync.receive(request.checkIns.map { it.toDomain() }))
}
