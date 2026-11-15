package com.galagans.crewhealth.health.infrastructure

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.galagans.crewhealth.device.application.DeviceRelay
import com.galagans.crewhealth.health.application.HealthEngine
import com.galagans.crewhealth.health.application.OXIMETER
import com.galagans.crewhealth.health.application.THERMOMETER
import com.galagans.crewhealth.health.application.frame
import org.junit.jupiter.api.AfterEach
import reactor.test.scheduler.VirtualTimeScheduler
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class HealthStatusPublisherTest {
    private val t0 = Instant.parse("2026-11-14T09:31:06Z")
    private val mapper = jacksonObjectMapper()
    private val relay = DeviceRelay()
    private val engine = HealthEngine(ClasspathRuleTable()) { "6f1c" }
    private val received = CopyOnWriteArrayList<String>()
    private val listener = relay.framesFor("display").subscribe { received += it }
    private val scheduler = VirtualTimeScheduler.create()

    /** Fixed at `at`, but throws on the given calls (1-based). */
    private class FlakyClock(private val at: Instant, private val failing: Set<Int>) : Clock() {
        private var calls = 0
        override fun instant(): Instant {
            if (++calls in failing) throw IllegalStateException("clock failure")
            return at
        }
        override fun getZone(): ZoneId = ZoneOffset.UTC
        override fun withZone(zone: ZoneId?): Clock = this
    }

    private fun publisher(clock: Clock = Clock.fixed(t0, ZoneOffset.UTC)) = HealthStatusPublisher(relay, engine, clock, mapper, scheduler)

    @AfterEach
    fun dispose() = listener.dispose()

    @Test
    fun `AC12 publishOnce sends the status on crew-a1-dot-display as backend-rules and returns true`() {
        engine.accept(frame(OXIMETER, t0, "spo2_pct" to 92, "pulse_bpm" to 63), t0)

        assertTrue(publisher().publishOnce(t0))

        val sent = mapper.readTree(received.single())
        assertEquals(listOf("topic", "payload"), sent.fieldNames().asSequence().toList())
        assertEquals("crew/a1/dot-display", sent["topic"].asText())
        assertEquals(
            listOf("6f1c", "2026-11-14T09:31:06Z", "42", "check", "backend-rules", "2"),
            sent["payload"].let { listOf(it["id"].asText(), it["t"].asText(), it["pct"].toString(), it["level"].asText(), it["src"].asText(), "${it["metrics"].size()}") },
        )
    }

    @Test
    fun `AC12 with no status publishOnce sends nothing and returns false`() {
        assertFalse(publisher().publishOnce(t0))
        assertEquals(emptyList(), received)
    }

    @Test
    fun `AC13 after start, relay frames reach the engine and a status is published every second`() {
        val publisher = publisher()
        publisher.start()

        relay.publish("device-a", frame(THERMOMETER, t0, "temp_c" to 36.9))
        scheduler.advanceTimeBy(Duration.ofSeconds(3))

        val statuses = received.filter { it.contains("crew/a1/dot-display") }
        assertEquals(3, statuses.size)
        publisher.stop()
    }

    @Test
    fun `AC13 an exception while handling a frame or a tick keeps both running`() {
        val publisher = publisher(FlakyClock(t0, failing = setOf(1, 3)))
        publisher.start()

        relay.publish("device-a", frame(THERMOMETER, t0, "temp_c" to 36.9))
        relay.publish("device-a", frame(OXIMETER, t0, "spo2_pct" to 92, "pulse_bpm" to 63))
        // Calls: frame 1 throws, frame 2, tick 1 throws, tick 2 publishes.
        scheduler.advanceTimeBy(Duration.ofSeconds(2))

        val statuses = received.filter { it.contains("crew/a1/dot-display") }.map { mapper.readTree(it)["payload"] }
        assertEquals(1, statuses.size)
        assertEquals(listOf("spo2Percent", "heartRateBpm"), statuses.single()["metrics"].map { it["indicator"].asText() })
        publisher.stop()
    }

    @Test
    fun `AC13 stop disposes the subscription and the interval`() {
        val publisher = publisher()
        val before = relay.subscriberCount()
        publisher.start()
        assertEquals(before + 1, relay.subscriberCount())

        publisher.stop()
        relay.publish("device-a", frame(THERMOMETER, t0, "temp_c" to 36.9))
        scheduler.advanceTimeBy(Duration.ofSeconds(3))

        assertEquals(before, relay.subscriberCount())
        assertEquals(1, received.size)
    }
}
