package com.galagans.crewhealth.health.infrastructure

import com.fasterxml.jackson.databind.ObjectMapper
import com.galagans.crewhealth.device.application.DeviceRelay
import com.galagans.crewhealth.health.application.HealthEngine
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import reactor.core.Disposable
import reactor.core.publisher.Flux
import reactor.core.scheduler.Scheduler
import reactor.core.scheduler.Schedulers
import java.time.Clock
import java.time.Duration
import java.time.Instant

/** Feeds every relay frame to the engine and publishes its status for the dot display once a second. */
class HealthStatusPublisher(
    private val relay: DeviceRelay,
    private val engine: HealthEngine,
    private val clock: Clock,
    private val mapper: ObjectMapper,
    private val scheduler: Scheduler = Schedulers.parallel(),
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private var frames: Disposable? = null
    private var ticks: Disposable? = null

    fun publishOnce(now: Instant): Boolean {
        val status = engine.status(now) ?: return false
        relay.publish(HealthEngine.PUBLISHER, mapper.writeValueAsString(mapOf("topic" to TOPIC, "payload" to status)))
        return true
    }

    @EventListener(ApplicationReadyEvent::class)
    fun start() {
        frames = relay.framesFor(HealthEngine.PUBLISHER).subscribe { frame ->
            try {
                engine.accept(frame, clock.instant())
            } catch (e: Exception) {
                log.warn("Health engine skipped a frame", e)
            }
        }
        ticks = Flux.interval(Duration.ofSeconds(1), scheduler).subscribe {
            try {
                publishOnce(clock.instant())
            } catch (e: Exception) {
                log.warn("Health status not published", e)
            }
        }
    }

    @PreDestroy
    fun stop() {
        frames?.dispose()
        ticks?.dispose()
    }

    companion object {
        const val TOPIC = "crew/a1/dot-display"
    }
}
