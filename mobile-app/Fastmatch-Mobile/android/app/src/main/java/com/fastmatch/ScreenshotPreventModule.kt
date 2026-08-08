package com.fastmatch

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenshotPreventModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "AppScreenshotPrevent"

    @ReactMethod
    fun forbid() {
        currentActivity?.runOnUiThread {
            currentActivity?.window?.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    @ReactMethod
    fun allow() {
        currentActivity?.runOnUiThread {
            currentActivity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
