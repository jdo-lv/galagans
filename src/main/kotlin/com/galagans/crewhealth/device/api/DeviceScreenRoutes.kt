package com.galagans.crewhealth.device.api

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.Resource
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.server.RouterFunction
import org.springframework.web.reactive.function.server.ServerResponse
import org.springframework.web.reactive.function.server.router

/** The hidden device screen, the frontend's device.html: the dot display simulated, or fed by the device link. */
@Configuration
class DeviceScreenRoutes {

    @Bean
    fun deviceScreen(@Value("classpath:/static/device.html") page: Resource): RouterFunction<ServerResponse> = router {
        (GET(SCREEN) or GET("$SCREEN/")) { ok().contentType(MediaType.TEXT_HTML).bodyValue(page) }
    }

    private companion object {
        const val SCREEN = "/device/{mode:simulation|websocket}"
    }
}
