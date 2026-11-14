package com.galagans.crewhealth.packet.api

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.galagans.crewhealth.packet.application.PacketInbox
import com.galagans.crewhealth.packet.domain.Packet
import com.galagans.crewhealth.packet.domain.PacketItem
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Named.named
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.json.JsonCompareMode
import org.springframework.test.web.reactive.server.WebTestClient
import java.time.Instant
import kotlin.test.assertEquals

@WebFluxTest(PacketController::class)
@Import(PacketControllerTest.RecordingInboxConfig::class)
class PacketControllerTest(
    @Autowired private val client: WebTestClient,
    @Autowired private val inbox: RecordingInbox,
) {

    class RecordingInbox : PacketInbox {
        val received = mutableListOf<Packet>()

        override fun receive(packet: Packet): String {
            received.add(packet)
            return packet.id
        }
    }

    class RecordingInboxConfig {
        @Bean
        fun recordingInbox() = RecordingInbox()
    }

    @BeforeEach
    fun clearInbox() {
        inbox.received.clear()
    }

    private fun post(body: String) = client.post().uri("/api/packets")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .exchange()

    @Test
    fun `AC1 receives the packet and returns its id`() {
        post(AC1_BODY)
            .expectStatus().isOk
            .expectBody().json("""{"id":"p-1"}""", JsonCompareMode.STRICT)

        assertEquals(listOf(AC1_PACKET), inbox.received)
    }

    @ParameterizedTest
    @MethodSource("blankNotes")
    fun `AC2 missing or blank note is received as empty`(body: String) {
        post(body).expectStatus().isOk

        assertEquals("", inbox.received.single().note)
    }

    @Test
    fun `AC2 note is kept untrimmed`() {
        post(ac1BodyWith { it["note"] = "  Slept badly.  " }).expectStatus().isOk

        assertEquals("  Slept badly.  ", inbox.received.single().note)
    }

    companion object {
        @JvmStatic
        fun blankNotes() = listOf(
            named("note missing", ac1BodyWith { it.remove("note") }),
            named("note null", ac1BodyWith { it["note"] = null }),
            named("note empty", ac1BodyWith { it["note"] = "" }),
            named("note spaces", ac1BodyWith { it["note"] = "   " }),
        )

        private val mapper = jacksonObjectMapper()

        const val AC1_BODY = """{"id":"p-1","builtAt":"2026-11-14T07:31:00Z","oneWayDelayMs":845000,"note":"Slept badly.","items":[{"key":"spo2","label":"SpO₂","unit":"%","state":"caution","value":92,"recordedAt":"2026-11-14T07:21:00Z","source":"manual","ruleId":"SPO-01","tier":"CMO"},{"key":"bloodPressure","label":"Blood pressure","unit":"mmHg","state":"synthetic","text":"108/70","source":"synthetic"}]}"""

        val AC1_PACKET = Packet(
            id = "p-1",
            builtAt = Instant.parse("2026-11-14T07:31:00Z"),
            oneWayDelayMs = 845000,
            note = "Slept badly.",
            items = listOf(
                PacketItem(
                    key = "spo2", label = "SpO₂", unit = "%", state = "caution", value = 92.0, text = null,
                    recordedAt = Instant.parse("2026-11-14T07:21:00Z"), source = "manual", ruleId = "SPO-01", tier = "CMO",
                ),
                PacketItem(
                    key = "bloodPressure", label = "Blood pressure", unit = "mmHg", state = "synthetic", value = null,
                    text = "108/70", recordedAt = null, source = "synthetic", ruleId = null, tier = null,
                ),
            ),
        )

        /** The AC1 body as JSON after [change] edits its parsed form. */
        fun ac1BodyWith(change: (MutableMap<String, Any?>) -> Unit): String {
            val body: MutableMap<String, Any?> = mapper.readValue(AC1_BODY)
            change(body)
            return mapper.writeValueAsString(body)
        }

        @Suppress("UNCHECKED_CAST")
        fun MutableMap<String, Any?>.items() = this["items"] as MutableList<MutableMap<String, Any?>>
    }
}
