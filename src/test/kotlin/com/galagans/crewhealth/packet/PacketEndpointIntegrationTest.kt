package com.galagans.crewhealth.packet

import com.galagans.crewhealth.packet.api.PacketControllerTest.Companion.AC1_BODY
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.json.JsonCompareMode
import org.springframework.test.web.reactive.server.WebTestClient

@SpringBootTest
@AutoConfigureWebTestClient
class PacketEndpointIntegrationTest(@Autowired private val client: WebTestClient) {

    private fun post(body: String) = client.post().uri("/api/packets")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .exchange()

    @Test
    fun `AC10 posting the same packet twice returns its id both times`() {
        repeat(2) {
            post(AC1_BODY)
                .expectStatus().isOk
                .expectBody().json("""{"id":"p-1"}""", JsonCompareMode.STRICT)
        }
    }
}
