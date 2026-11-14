package com.galagans.crewhealth.device.api

import com.galagans.crewhealth.device.application.DeviceRelay
import org.springframework.stereotype.Component
import org.springframework.web.reactive.socket.WebSocketHandler
import org.springframework.web.reactive.socket.WebSocketMessage
import org.springframework.web.reactive.socket.WebSocketSession
import reactor.core.publisher.Mono

@Component
class DeviceSocketHandler(private val relay: DeviceRelay) : WebSocketHandler {

    override fun handle(session: WebSocketSession): Mono<Void> {
        val input = session.receive()
            .filter { it.type == WebSocketMessage.Type.TEXT }
            .doOnNext { relay.publish(session.id, it.payloadAsText) }
            .then()
        val output = session.send(
            relay.framesFor(session.id)
                .takeUntilOther(session.closeStatus())
                .map(session::textMessage),
        )
        return Mono.zip(input, output).then()
    }
}
