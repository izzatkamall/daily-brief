package com.example.dailybrief.data.model

/** Mirrors the Task shape returned by the backend API. */
data class Task(
    val id: Int,
    val title: String,
    val description: String = "",
    val dueDate: String? = null,
    val priority: String = "medium",
    val status: String = "open",
    val createdAt: String? = null,
    val updatedAt: String? = null,
) {
    val isCompleted: Boolean get() = status == "completed"
}

data class LoginRequest(val username: String, val password: String)

data class LoginResponse(val token: String, val username: String)

/** Payload for creating or updating a task. Null fields are omitted by Gson. */
data class TaskInput(
    val title: String? = null,
    val description: String? = null,
    val dueDate: String? = null,
    val priority: String? = null,
    val status: String? = null,
)

data class BriefResponse(val brief: String, val source: String, val generatedAt: String)
