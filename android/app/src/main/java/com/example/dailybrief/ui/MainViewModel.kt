package com.example.dailybrief.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.dailybrief.data.ApiClient
import com.example.dailybrief.data.model.LoginRequest
import com.example.dailybrief.data.model.Task
import com.example.dailybrief.data.model.TaskInput
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class UiState(
    val loggedIn: Boolean = false,
    val tasks: List<Task> = emptyList(),
    val statusFilter: String? = null,   // null = all, "open", "completed"
    val loading: Boolean = false,
    val error: String? = null,
    val brief: String? = null,
    val briefSource: String? = null,
    val briefLoading: Boolean = false,
)

class MainViewModel : ViewModel() {
    private val api = ApiClient.api
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun login(username: String, password: String) {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val res = api.login(LoginRequest(username, password))
                ApiClient.setToken(res.token)
                _state.update { it.copy(loggedIn = true, loading = false) }
                loadTasks()
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = friendly(e)) }
            }
        }
    }

    fun logout() {
        ApiClient.setToken(null)
        _state.value = UiState()
    }

    fun setStatusFilter(status: String?) {
        _state.update { it.copy(statusFilter = status) }
        loadTasks()
    }

    fun loadTasks() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val tasks = api.listTasks(status = _state.value.statusFilter)
                _state.update { it.copy(tasks = tasks, loading = false) }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = friendly(e)) }
            }
        }
    }

    fun createTask(title: String, description: String, dueDate: String?, priority: String) {
        viewModelScope.launch {
            try {
                api.createTask(
                    TaskInput(
                        title = title,
                        description = description,
                        dueDate = dueDate,
                        priority = priority,
                    ),
                )
                loadTasks()
            } catch (e: Exception) {
                _state.update { it.copy(error = friendly(e)) }
            }
        }
    }

    fun toggleComplete(task: Task) {
        viewModelScope.launch {
            try {
                val newStatus = if (task.isCompleted) "open" else "completed"
                api.updateTask(task.id, TaskInput(status = newStatus))
                loadTasks()
            } catch (e: Exception) {
                _state.update { it.copy(error = friendly(e)) }
            }
        }
    }

    fun generateBrief() {
        _state.update { it.copy(briefLoading = true, error = null) }
        viewModelScope.launch {
            try {
                val res = api.generateBrief()
                _state.update {
                    it.copy(brief = res.brief, briefSource = res.source, briefLoading = false)
                }
            } catch (e: Exception) {
                _state.update { it.copy(briefLoading = false, error = friendly(e)) }
            }
        }
    }

    fun clearError() = _state.update { it.copy(error = null) }

    private fun friendly(e: Exception): String =
        e.message?.let { "Network error: $it" } ?: "Something went wrong"
}
