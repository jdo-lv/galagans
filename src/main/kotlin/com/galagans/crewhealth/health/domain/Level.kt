package com.galagans.crewhealth.health.domain

import com.fasterxml.jackson.annotation.JsonValue

/** The alert levels a rule row can set (ideas/alert-levels.md), least severe first. */
enum class Level {
    NOMINAL, WATCH, CHECK, TREAT, EMERGENCY;

    @get:JsonValue
    val word: String get() = name.lowercase()

    companion object {
        fun fromWord(word: String): Level? = entries.firstOrNull { it.word == word }
    }
}
