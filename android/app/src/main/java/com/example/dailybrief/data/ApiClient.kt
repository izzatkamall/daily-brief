package com.example.dailybrief.data

import com.example.dailybrief.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Builds the Retrofit API. Holds the auth token in memory and attaches it as a
 * Bearer header on every request once the user has logged in.
 */
object ApiClient {
    @Volatile
    private var token: String? = null

    fun setToken(value: String?) {
        token = value
    }

    val api: DailyBriefApi by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val builder = chain.request().newBuilder()
                token?.let { builder.header("Authorization", "Bearer $it") }
                chain.proceed(builder.build())
            }
            .addInterceptor(logging)
            .build()

        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(DailyBriefApi::class.java)
    }
}
