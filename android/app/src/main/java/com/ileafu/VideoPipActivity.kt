package com.ileafu

import android.app.PictureInPictureParams
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.Rational
import android.view.TextureView
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.modules.core.DeviceEventManagerModule

class VideoPipActivity : AppCompatActivity() {

  private var textureView: TextureView? = null
  private var remoteUid: Int = 0

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    textureView = TextureView(this)
    textureView?.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    setContentView(textureView)

    remoteUid = intent?.getIntExtra("REMOTE_UID", 0) ?: 0

    // Ensure engine exists and attach renderer
    AgoraEngineHolder.getEngine()?.let {
      AgoraEngineHolder.attachRendererToTexture(textureView!!, remoteUid)
    }

    val enter = intent?.getBooleanExtra("ENTER_PIP", false) ?: false
    if (enter) enterPip()
  }

  fun enterPip() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val ar = Rational(9, 16)
      val params = PictureInPictureParams.Builder().setAspectRatio(ar).build()
      val entered = enterPictureInPictureMode(params)
      Log.d("VideoPipActivity", "enterPictureInPictureMode result: $entered")
    }
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)
    Log.d("VideoPipActivity", "PiP changed: $isInPictureInPictureMode")
    try {
      val reactContext = (application as com.facebook.react.ReactApplication).reactNativeHost.reactInstanceManager.currentReactContext
      reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit("onPipModeChanged", isInPictureInPictureMode)
    } catch (ex: Exception) {
      Log.e("VideoPipActivity", "emit pip event failed", ex)
    }

    if (!isInPictureInPictureMode) {
      finish()
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    AgoraEngineHolder.detachRenderer(remoteUid)
  }
}
