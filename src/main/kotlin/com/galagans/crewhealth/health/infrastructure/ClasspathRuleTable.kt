package com.galagans.crewhealth.health.infrastructure

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.galagans.crewhealth.health.domain.Level
import com.galagans.crewhealth.health.domain.RuleRow
import com.galagans.crewhealth.health.domain.RuleTable
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource

/** The crew app's `rules.json`, copied to the classpath by the build; checked once at construction. */
class ClasspathRuleTable(resource: Resource = ClassPathResource("health/rules.json")) : RuleTable {
    private val rows: List<RuleRow> = resource.inputStream.use { ObjectMapper().readTree(it) }.mapIndexed(::toRow)

    override fun rows(): List<RuleRow> = rows

    private fun toRow(i: Int, node: JsonNode): RuleRow {
        val level = node.path("status").takeIf { it.isTextual }?.let { Level.fromWord(it.asText()) }
        check(level != null && level != Level.NOMINAL) { "Rule row $i: status must be watch, check, treat or emergency" }
        return RuleRow(
            id = node.path("id").asText(),
            indicator = node.path("indicator").asText(),
            label = node.path("label").asText(),
            unit = node.path("unit").asText(),
            below = limit(i, node, "below"),
            above = limit(i, node, "above"),
            level = level,
        )
    }

    private fun limit(i: Int, node: JsonNode, key: String): Double? {
        if (!node.has(key)) return null
        val value = node.get(key)
        check(value.isNumber) { "Rule row $i: below and above must be numbers" }
        return value.asDouble()
    }
}
