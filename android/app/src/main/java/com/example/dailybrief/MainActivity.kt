package com.example.dailybrief

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.collectAsState
import com.example.dailybrief.ui.LoginScreen
import com.example.dailybrief.ui.MainViewModel
import com.example.dailybrief.ui.TasksScreen

private val Accent = Color(0xFF6C8CFF)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val colors = if (isSystemInDarkTheme()) {
                darkColorScheme(primary = Accent)
            } else {
                lightColorScheme(primary = Accent)
            }
            MaterialTheme(colorScheme = colors) {
                Surface {
                    val vm: MainViewModel = viewModel()
                    val state by vm.state.collectAsState()
                    if (state.loggedIn) {
                        TasksScreen(state = state, vm = vm)
                    } else {
                        LoginScreen(state = state, vm = vm)
                    }
                }
            }
        }
    }
}
