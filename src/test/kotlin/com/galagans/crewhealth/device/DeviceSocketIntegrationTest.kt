package com.galagans.crewhealth.device

import com.galagans.crewhealth.device.application.DeviceRelay
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.web.reactive.socket.WebSocketMessage
import org.springframework.web.reactive.socket.WebSocketSession
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient
import reactor.core.Disposable
import reactor.core.publisher.Mono
import reactor.core.publisher.Sinks
import java.net.URI
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.fail

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DeviceSocketIntegrationTest(
    @Autowired private val relay: DeviceRelay,
    @LocalServerPort private val port: Int,
) {
    private val peers = mutableListOf<Peer>()
    private var baseline = 0

    /** One WebSocket client: records every frame it receives and sends what it's given. */
    private inner class Peer {
        val received = LinkedBlockingQueue<String>()
        private val outbound = Sinks.many().unicast().onBackpressureBuffer<(WebSocketSession) -> WebSocketMessage>()
        private val connection: Disposable = ReactorNettyWebSocketClient()
            .execute(URI("ws://localhost:$port/ws/devices")) { session ->
                val receive = session.receive().doOnNext { received.add(it.payloadAsText) }.then()
                val send = session.send(outbound.asFlux().map { it(session) })
                Mono.zip(receive, send).then()
            }
            .subscribe()

        fun sendText(text: String) = outbound.tryEmitNext { it.textMessage(text) }
        fun sendBinary(bytes: ByteArray) = outbound.tryEmitNext { s -> s.binaryMessage { it.wrap(bytes) } }
        fun close() = connection.dispose()
        fun next(ms: Long): String? = received.poll(ms, TimeUnit.MILLISECONDS)
    }

    private fun connect(count: Int): List<Peer> {
        val expected = relay.subscriberCount() + count
        val added = List(count) { Peer() }.also { peers += it }
        awaitSubscribers(expected)
        return added
    }

    private fun awaitSubscribers(expected: Int) {
        val deadline = System.currentTimeMillis() + 5_000
        while (relay.subscriberCount() != expected) {
            if (System.currentTimeMillis() > deadline) fail("relay has ${relay.subscriberCount()} subscribers, expected $expected")
            Thread.sleep(10)
        }
    }

    /** Subscribers before any peer, the health status publisher's own included. */
    @BeforeEach
    fun countBaseline() {
        baseline = relay.subscriberCount()
    }

    @AfterEach
    fun closeAll() {
        peers.forEach { it.close() }
        awaitSubscribers(baseline)
    }

    @Test
    fun `AC1 a frame reaches the other session unchanged and not its sender`() {
        val (a, b) = connect(2)
        val frame = """{"topic":"crew/a1/oximeter","payload":{"spo2_pct":91}}"""

        a.sendText(frame)

        assertEquals(frame, b.next(1_000))
        assertNull(a.next(500))
    }

    @Test
    fun `AC2 a text frame that isn't JSON is relayed, a binary frame is not`() {
        val (a, b) = connect(2)

        a.sendText("not json")
        assertEquals("not json", b.next(1_000))

        a.sendBinary(byteArrayOf(1, 2, 3))
        assertNull(b.next(500))
    }

    @Test
    fun `AC3 a session that connects later gets nothing sent before it connected`() {
        val (a, b) = connect(2)
        a.sendText("early")
        assertEquals("early", b.next(1_000))

        val (c) = connect(1)

        assertNull(c.next(500))
    }

    @Test
    fun `AC4 a closed session doesn't stop the relay between the others`() {
        val (a, b, c) = connect(3)

        c.close()
        awaitSubscribers(baseline + 2)
        a.sendText("after close")

        assertEquals("after close", b.next(1_000))
    }
}
