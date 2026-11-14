package com.galagans.crewhealth.packet.api

import com.galagans.crewhealth.packet.application.PacketInbox
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/packets")
class PacketController(private val inbox: PacketInbox) {

    @PostMapping
    fun receive(@Valid @RequestBody request: PacketRequest): PacketResponse =
        PacketResponse(inbox.receive(request.toDomain()))
}
