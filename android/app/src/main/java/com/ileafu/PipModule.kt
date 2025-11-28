package com.ileafu

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Build
import android.util.Log
import android.util.Rational
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.Intent

class PipModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "PipModule"
  }

  @ReactMethod
  fun enterPip() {
    val activity: Activity? = currentActivity
    if (activity == null) {
      Log.w("PipModule", "enterPip: currentActivity is null")
      return
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      Log.w("PipModule", "enterPip: API level does not support PiP")
      return
    }

    val params = PictureInPictureParams.Builder()
      .setAspectRatio(Rational(9, 16))
      .build()

    // Ensure we call on the UI thread
    activity.runOnUiThread {
      try {
        val entered = activity.enterPictureInPictureMode(params)
        Log.d("PipModule", "enterPictureInPictureMode called, result=$entered")
      } catch (ex: Exception) {
        Log.e("PipModule", "enterPip failed", ex)
      }
    }
  }

  @ReactMethod
  fun startPip(remoteUid: Int) {
    val ctx = reactApplicationContext
    try {
      val intent = Intent(ctx, VideoPipActivity::class.java)
      intent.putExtra("REMOTE_UID", remoteUid)
      intent.putExtra("ENTER_PIP", true)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    } catch (ex: Exception) {
      Log.e("PipModule", "startPip failed", ex)
    }
  }

  @ReactMethod
  fun initNativeEngine(appId: String) {
    try {
      AgoraEngineHolder.initEngine(reactApplicationContext, appId)
    } catch (ex: Exception) {
      Log.e("PipModule", "initNativeEngine failed", ex)
    }
  }
}
