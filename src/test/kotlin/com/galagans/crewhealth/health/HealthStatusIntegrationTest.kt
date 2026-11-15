package com.galagans.crewhealth.health

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.galagans.crewhealth.device.application.DeviceRelay
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.annotation.DirtiesContext
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient
import reactor.core.Disposable
import reactor.core.publisher.Mono
import reactor.core.publisher.Sinks
import java.net.URI
import java.time.Instant
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext
class HealthStatusIntegrationTest(
    @Autowired private val relay: DeviceRelay,
    @LocalServerPort private val port: Int,
) {
    private val mapper = jacksonObjectMapper()
    private val clients = mutableListOf<Disposable>()

    private inner class Client {
        val received = LinkedBlockingQueue<String>()
        val outbound = Sinks.many().unicast().onBackpressureBuffer<String>()

        init {
            clients += ReactorNettyWebSocketClient()
                .execute(URI("ws://localhost:$port/ws/devices")) { session ->
                    val receive = session.receive().doOnNext { received.add(it.payloadAsText) }.then()
                    Mono.zip(receive, session.send(outbound.asFlux().map(session::textMessage))).then()
                }
                .subscribe()
        }

        /** The first `crew/a1/dot-display` payload within `ms`, skipping other frames. */
        fun nextStatus(ms: Long): JsonNode? {
            val deadline = System.currentTimeMillis() + ms
            while (true) {
                val left = deadline - System.currentTimeMillis()
                if (left <= 0) return null
                val frame = received.poll(left, TimeUnit.MILLISECONDS) ?: return null
                val node = mapper.readTree(frame)
                if (node["topic"]?.asText() == "crew/a1/dot-display") return node["payload"]
            }
        }
    }

    @AfterEach
    fun closeAll() = clients.forEach { it.dispose() }

    @Test
    fun `AC15 an oximeter frame from one client reaches the other as a dot display status within 3 s`() {
        val expected = relay.subscriberCount() + 2
        val a = Client()
        val b = Client()
        val deadline = System.currentTimeMillis() + 5_000
        while (relay.subscriberCount() < expected && System.currentTimeMillis() < deadline) Thread.sleep(10)

        val frame = mapOf(
            "topic" to "crew/a1/oximeter",
            "payload" to mapOf("id" to "ox-1", "t" to Instant.now().toString(), "spo2_pct" to 92, "pulse_bpm" to 63, "src" to "synthetic"),
        )
        a.outbound.tryEmitNext(mapper.writeValueAsString(frame))

        val status = assertNotNull(b.nextStatus(3_000))
        assertEquals("check", status["level"].asText())
        assertEquals("42", status["pct"].toString())
        assertEquals(
            listOf("spo2Percent check SPO-01", "heartRateBpm nominal null"),
            status["metrics"].map { "${it["indicator"].asText()} ${it["level"].asText()} ${it["ruleId"]?.asText()}" },
        )
        assertTrue(a.received.none { mapper.readTree(it)["topic"]?.asText() == "crew/a1/oximeter" })
    }
}
