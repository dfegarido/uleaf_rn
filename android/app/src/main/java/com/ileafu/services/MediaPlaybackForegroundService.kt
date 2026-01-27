package com.ileafu.services

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * Foreground service for media playback when viewing live video streams.
 * This service is declared in the manifest with foregroundServiceType="mediaPlayback"
 * to comply with Android 14+ requirements.
 * 
 * The Agora SDK uses foreground services for live video playback.
 * This service declaration ensures compliance with Google Play Store policies.
 */
class MediaPlaybackForegroundService : Service() {
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
