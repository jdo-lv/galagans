package com.galagans.crewhealth.health.infrastructure

import com.galagans.crewhealth.health.domain.Level
import com.galagans.crewhealth.health.domain.RuleRow
import org.springframework.core.io.ByteArrayResource
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ClasspathRuleTableTest {
    private fun table(json: String) = ClasspathRuleTable(ByteArrayResource(json.toByteArray()))

    private fun row(extra: String) = """{"id":"X-01","indicator":"spo2Percent","label":"SpO₂","unit":"%",$extra}"""

    @Test
    fun `AC2 reads every row of the real rules json, baseline rows included`() {
        val rows = ClasspathRuleTable().rows()

        assertEquals(RuleRow("SPO-01", "spo2Percent", "SpO₂", "%", 94.0, null, Level.CHECK), rows.first())
        assertEquals(RuleRow("COG-01", "pvtMedianMs", "PVT median", "ms", null, null, Level.CHECK), rows.single { it.id == "COG-01" })
    }

    @Test
    fun `AC2 a row whose status isn't watch, check, treat or emergency fails at construction`() {
        listOf("\"status\":\"nominal\"", "\"status\":\"caution\"", "\"status\":3", "\"below\":1").forEach { bad ->
            val error = assertFailsWith<IllegalStateException> { table("[${row("\"below\":1,\"status\":\"check\"")},${row(bad)}]") }
            assertEquals("Rule row 1: status must be watch, check, treat or emergency", error.message)
        }
    }

    @Test
    fun `AC2 a below or above that isn't a JSON number fails at construction`() {
        listOf("\"below\":\"94\"", "\"above\":true", "\"above\":null").forEach { bad ->
            val error = assertFailsWith<IllegalStateException> { table("[${row("$bad,\"status\":\"check\"")}]") }
            assertEquals("Rule row 0: below and above must be numbers", error.message)
        }
    }
}
