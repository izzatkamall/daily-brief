package com.example.dailybrief.data

import com.example.dailybrief.data.model.BriefResponse
import com.example.dailybrief.data.model.LoginRequest
import com.example.dailybrief.data.model.LoginResponse
import com.example.dailybrief.data.model.Task
import com.example.dailybrief.data.model.TaskInput
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Query

/** Retrofit description of the backend REST API (shared with the web app). */
interface DailyBriefApi {
    @POST("api/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("api/tasks")
    suspend fun listTasks(
        @Query("status") status: String? = null,
        @Query("priority") priority: String? = null,
    ): List<Task>

    @POST("api/tasks")
    suspend fun createTask(@Body body: TaskInput): Task

    @PUT("api/tasks/{id}")
    suspend fun updateTask(@retrofit2.http.Path("id") id: Int, @Body body: TaskInput): Task

    @POST("api/brief")
    suspend fun generateBrief(): BriefResponse
}
