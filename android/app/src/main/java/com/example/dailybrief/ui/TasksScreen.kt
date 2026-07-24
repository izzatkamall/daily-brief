package com.example.dailybrief.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MaterialTheme.typography
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.example.dailybrief.data.model.Task

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(state: UiState, vm: MainViewModel) {
    var showCreate by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Daily Brief") },
                actions = {
                    IconButton(onClick = { vm.logout() }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Log out")
                    }
                },
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add task")
            }
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item { BriefCard(state, vm) }
            item { FilterRow(state, vm) }

            if (state.loading) {
                item {
                    Row(
                        Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.Center,
                    ) { CircularProgressIndicator() }
                }
            }
            state.error?.let { err ->
                item {
                    Text(err, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(4.dp))
                }
            }
            if (!state.loading && state.tasks.isEmpty()) {
                item {
                    Text(
                        "No tasks yet. Tap + to add one.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
            items(state.tasks, key = { it.id }) { task ->
                TaskRow(task = task, onToggle = { vm.toggleComplete(task) })
            }
        }
    }

    if (showCreate) {
        CreateTaskDialog(
            onDismiss = { showCreate = false },
            onCreate = { title, desc, due, priority ->
                vm.createTask(title, desc, due, priority)
                showCreate = false
            },
        )
    }
}

@Composable
private fun BriefCard(state: UiState, vm: MainViewModel) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("AI Daily Brief", style = typography.titleMedium)
                androidx.compose.material3.Button(
                    onClick = { vm.generateBrief() },
                    enabled = !state.briefLoading,
                ) {
                    Text(if (state.briefLoading) "Generating…" else "Generate")
                }
            }
            val brief = state.brief
            if (brief != null) {
                Text(brief, style = typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
                Text(
                    if (state.briefSource == "fallback") "Generated locally" else "via ${state.briefSource}",
                    style = typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp),
                )
            } else {
                Text(
                    "Tap Generate for a summary of your open tasks.",
                    style = typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterRow(state: UiState, vm: MainViewModel) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        val options = listOf<Pair<String, String?>>("All" to null, "Open" to "open", "Completed" to "completed")
        options.forEach { (label, value) ->
            FilterChip(
                selected = state.statusFilter == value,
                onClick = { vm.setStatusFilter(value) },
                label = { Text(label) },
            )
        }
    }
}

@Composable
private fun TaskRow(task: Task, onToggle: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Checkbox(checked = task.isCompleted, onCheckedChange = { onToggle() })
            Column(Modifier.padding(start = 4.dp)) {
                Text(
                    task.title,
                    style = typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else null,
                )
                if (task.description.isNotBlank()) {
                    Text(
                        task.description,
                        style = typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        task.priority.uppercase(),
                        style = typography.labelSmall,
                        color = priorityColor(task.priority),
                        fontWeight = FontWeight.Bold,
                    )
                    task.dueDate?.let {
                        Text(
                            "Due ${it.take(10)}",
                            style = typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun priorityColor(priority: String) = when (priority) {
    "high" -> androidx.compose.ui.graphics.Color(0xFFE5484D)
    "medium" -> androidx.compose.ui.graphics.Color(0xFFF5A623)
    else -> androidx.compose.ui.graphics.Color(0xFF3DA35D)
}
