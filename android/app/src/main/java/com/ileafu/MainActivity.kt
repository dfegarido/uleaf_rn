package com.ileafu

import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "iLeafU"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)
    Log.d("MainActivity", "onPictureInPictureModeChanged: isInPiP=$isInPictureInPictureMode")
    // When entering PiP, keep video rendering active. If additional handling is required
    // (e.g., keep SurfaceView/TextureView visible), do it here.
    try {
      val reactContext = (application as ReactApplication).reactNativeHost.reactInstanceManager.currentReactContext
      if (reactContext != null) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("onPipModeChanged", isInPictureInPictureMode)
      } else {
        Log.w("MainActivity", "React context is null; cannot emit PiP event")
      }
    } catch (ex: Exception) {
      Log.e("MainActivity", "Failed to emit PiP event", ex)
    }
  }

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    Log.d("MainActivity", "onUserLeaveHint called - user is leaving the activity (possible home pressed)")
  }
}
