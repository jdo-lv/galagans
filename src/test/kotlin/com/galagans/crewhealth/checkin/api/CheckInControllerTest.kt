package com.galagans.crewhealth.checkin.api

import com.galagans.crewhealth.checkin.application.CheckInSync
import com.galagans.crewhealth.checkin.domain.CheckIn
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.web.reactive.server.WebTestClient

@WebFluxTest(CheckInController::class)
@Import(CheckInControllerTest.FakeSync::class)
class CheckInControllerTest(@Autowired private val client: WebTestClient) {

    class FakeSync {
        @Bean
        fun checkInSync() = object : CheckInSync {
            override fun receive(checkIns: List<CheckIn>) = checkIns.map { it.id }
        }
    }

    private fun post(body: String) = client.post().uri("/api/checkins/sync")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .exchange()

    @Test
    fun `returns the accepted ids`() {
        post("""{"checkIns":[{"id":"a","recordedAt":"2026-11-14T08:00:00Z","mood":4}]}""")
            .expectStatus().isOk
            .expectBody().jsonPath("$.acceptedIds[0]").isEqualTo("a")
    }

    @Test
    fun `accepts a PVT-only check-in and ignores the fields it does not store yet`() {
        post("""{"checkIns":[{"id":"p","recordedAt":"2026-11-14T08:00:00Z","pvtMedianMs":312,"pvtLapses":6,"pvtFalseStarts":1,"symptoms":[]}]}""")
            .expectStatus().isOk
            .expectBody().jsonPath("$.acceptedIds[0]").isEqualTo("p")
    }

    @Test
    fun `rejects a mood outside 1 to 5`() {
        post("""{"checkIns":[{"id":"a","recordedAt":"2026-11-14T08:00:00Z","mood":9}]}""")
            .expectStatus().isBadRequest
    }
}
