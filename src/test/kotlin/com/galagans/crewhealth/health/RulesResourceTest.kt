package com.galagans.crewhealth.health

import org.springframework.core.io.ClassPathResource
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertContentEquals

class RulesResourceTest {
    @Test
    fun `AC1 the build copies the frontend rules json to health rules json unchanged`() {
        val source = Files.readAllBytes(Path.of("src/main/frontend/src/infrastructure/rules.json"))
        val copied = ClassPathResource("health/rules.json").inputStream.use { it.readAllBytes() }

        assertContentEquals(source, copied)
    }
}
