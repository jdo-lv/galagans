package com.galagans.crewhealth.device

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.reactive.server.WebTestClient
import kotlin.test.assertContains

@SpringBootTest
@AutoConfigureWebTestClient
class DeviceScreenRoutesTest(@Autowired private val client: WebTestClient) {

    @Test
    fun `device simulation and websocket paths serve the device page`() {
        listOf("/device/simulation", "/device/websocket", "/device/websocket/").forEach { path ->
            client.get().uri(path).exchange()
                .expectStatus().isOk
                .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_HTML)
                .expectBody(String::class.java).value { assertContains(it!!, "device page stub", message = path) }
        }
    }

    @Test
    fun `other device paths are not found`() {
        listOf("/device/other", "/device").forEach { path ->
            client.get().uri(path).exchange().expectStatus().isNotFound
        }
    }
}
