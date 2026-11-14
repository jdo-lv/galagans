package com.galagans.crewhealth.device.api

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.HandlerMapping
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping

@Configuration
class DeviceSocketConfig {

    // Order -1: ahead of the annotated controllers.
    @Bean
    fun deviceSocketMapping(handler: DeviceSocketHandler): HandlerMapping =
        SimpleUrlHandlerMapping(mapOf("/ws/devices" to handler), -1)
}
