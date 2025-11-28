package com.ileafu

import android.content.Context
import android.view.TextureView

object AgoraEngineHolder {
  private var engine: Any? = null
  var currentRemoteUid: Int? = null

  fun initEngine(context: Context, appId: String) {
    if (engine != null) return
    try {
      // Create a minimal IRtcEngineEventHandler proxy to pass into the native create call
      val handlerClass = try { Class.forName("io.agora.rtc.IRtcEngineEventHandler") } catch (e: ClassNotFoundException) { null }
      val handlerInstance = handlerClass?.let { cls ->
        java.lang.reflect.Proxy.newProxyInstance(
          cls.classLoader,
          arrayOf(cls),
        ) { _, _, _ -> null }
      }

      val rtcClass = Class.forName("io.agora.rtc.RtcEngine")
      val createMethod = rtcClass.getMethod("create", Context::class.java, String::class.java, handlerClass ?: Any::class.java)
      engine = createMethod.invoke(null, context, appId, handlerInstance)

      // setChannelProfile and setClientRole if available
      try {
        val constantsClass = Class.forName("io.agora.rtc.Constants")
        val channelProfileField = constantsClass.getField("CHANNEL_PROFILE_LIVE_BROADCASTING")
        val clientRoleField = constantsClass.getField("CLIENT_ROLE_AUDIENCE")
        val channelProfile = channelProfileField.getInt(null)
        val clientRole = clientRoleField.getInt(null)

        engine?.javaClass?.getMethod("setChannelProfile", Int::class.javaPrimitiveType)?.invoke(engine, channelProfile)
        engine?.javaClass?.getMethod("setClientRole", Int::class.javaPrimitiveType)?.invoke(engine, clientRole)
      } catch (_: Exception) {
        // ignore if methods/fields not present in this SDK variant
      }
    } catch (ex: Exception) {
      ex.printStackTrace()
    }
  }

  fun getEngine(): Any? = engine

  fun attachRendererToTexture(textureView: TextureView, uid: Int) {
    try {
      if (engine == null) return
      val videoCanvasClass = Class.forName("io.agora.rtc.video.VideoCanvas")
      // Constructor: VideoCanvas(View, int renderMode, int uid)
      val ctor = videoCanvasClass.getConstructor(android.view.View::class.java, Int::class.javaPrimitiveType, Int::class.javaPrimitiveType)
      val renderModeField = videoCanvasClass.getField("RENDER_MODE_FIT")
      val renderMode = renderModeField.getInt(null)
      val canvas = ctor.newInstance(textureView, renderMode, uid)

      val setupMethod = engine!!.javaClass.getMethod("setupRemoteVideo", videoCanvasClass)
      setupMethod.invoke(engine, canvas)
      currentRemoteUid = uid
    } catch (ex: Exception) {
      ex.printStackTrace()
    }
  }

  fun detachRenderer(uid: Int) {
    try {
      if (engine == null) return
      val videoCanvasClass = Class.forName("io.agora.rtc.video.VideoCanvas")
      val ctor = videoCanvasClass.getConstructor(android.view.View::class.java, Int::class.javaPrimitiveType, Int::class.javaPrimitiveType)
      val renderModeField = videoCanvasClass.getField("RENDER_MODE_FIT")
      val renderMode = renderModeField.getInt(null)
      val canvas = ctor.newInstance(null, renderMode, uid)

      val setupMethod = engine!!.javaClass.getMethod("setupRemoteVideo", videoCanvasClass)
      setupMethod.invoke(engine, canvas)
      if (currentRemoteUid == uid) currentRemoteUid = null
    } catch (ex: Exception) {
      ex.printStackTrace()
    }
  }

  fun release() {
    try {
      engine?.let {
        try { it.javaClass.getMethod("leaveChannel")?.invoke(it) } catch (_: Exception) {}
        try {
          val rtcClass = Class.forName("io.agora.rtc.RtcEngine")
          rtcClass.getMethod("destroy")?.invoke(null)
        } catch (_: Exception) {}
      }
    } catch (ex: Exception) {
      ex.printStackTrace()
    }
    engine = null
    currentRemoteUid = null
  }
}
