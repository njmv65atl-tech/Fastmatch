package com.fastmatch

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class FileDownloaderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "FileDownloader"

    @ReactMethod
    fun downloadImage(url: String, fileName: String, promise: Promise) {
        try {
            val downloadManager = reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val uri = Uri.parse(url)
            val request = DownloadManager.Request(uri)
            
            request.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_WIFI or DownloadManager.Request.NETWORK_MOBILE)
            request.setAllowedOverRoaming(false)
            request.setTitle(fileName)
            request.setDescription("Downloading image...")
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            
            downloadManager.enqueue(request)
            promise.resolve("Download started")
        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message)
        }
    }
}
