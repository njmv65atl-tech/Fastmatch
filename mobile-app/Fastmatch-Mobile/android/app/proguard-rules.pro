# React Native ProGuard Rules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class * implements com.facebook.react.bridge.NativeModule {
    *;
}
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    *;
}

# Keep Stream Video SDK
-keep class io.getstream.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }

# Keep WebRTC
-keep class org.webrtc.** { *; }

# Keep model/data classes used by Gson/Serialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.fastmatch.** { *; }

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep R8 full mode compatibility
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class com.facebook.react.turbomodule.** { *; }
