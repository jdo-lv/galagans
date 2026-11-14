package com.galagans.crewhealth.device.application

import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import reactor.core.publisher.Sinks

/** Stand-in for the spacecraft LAN: fans device frames out to the other open sessions and stores nothing. */
@Component
class DeviceRelay {
    private data class Frame(val sender: String, val text: String)

    private val sink = Sinks.many().multicast().directBestEffort<Frame>()

    /** Drops the frame when it can't be emitted (no subscriber, no demand); only a concurrent emit is retried. */
    fun publish(sender: String, text: String) {
        val deadline = System.nanoTime() + RETRY_NANOS
        while (sink.tryEmitNext(Frame(sender, text)) == Sinks.EmitResult.FAIL_NON_SERIALIZED) {
            if (System.nanoTime() > deadline) return
            Thread.onSpinWait()
        }
    }

    fun framesFor(session: String): Flux<String> = sink.asFlux().filter { it.sender != session }.map { it.text }

    fun subscriberCount(): Int = sink.currentSubscriberCount()

    private companion object {
        const val RETRY_NANOS = 100_000_000L
    }
}
