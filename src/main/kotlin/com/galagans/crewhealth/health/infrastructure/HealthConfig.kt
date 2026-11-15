package com.galagans.crewhealth.health.infrastructure

import com.fasterxml.jackson.databind.ObjectMapper
import com.galagans.crewhealth.device.application.DeviceRelay
import com.galagans.crewhealth.health.application.HealthEngine
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Clock

@Configuration
class HealthConfig {
    @Bean
    fun clock(): Clock = Clock.systemUTC()

    @Bean
    fun healthEngine(): HealthEngine = HealthEngine(ClasspathRuleTable())

    @Bean
    fun healthStatusPublisher(relay: DeviceRelay, engine: HealthEngine, clock: Clock, mapper: ObjectMapper) =
        HealthStatusPublisher(relay, engine, clock, mapper)
}
