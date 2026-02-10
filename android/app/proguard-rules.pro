# ==============================================================================
# PROGUARD RULES PER REACT NATIVE 0.76+
# ==============================================================================
# Aggiornato per React Native 0.76.7 con Hermes integrato
# Nota: In RN 0.76+, Hermes è parte di react-android, non una dipendenza separata
# ==============================================================================

# --- REGOLE GENERALI REACT NATIVE ---
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.react.bridge.ReactMethod

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.react.bridge.ReactMethod class * { *; }

-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }

# Mantieni i metodi nativi e le classi di bridge
-keepclassmembers,includedescriptorclasses class * {
    native <methods>;
}
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }

-dontwarn com.facebook.react.**

# --- HERMES ENGINE (RN 0.76+) ---
# In React Native 0.76+, Hermes è integrato in libreactnative.so
# NON esiste più libhermes_executor.so - è stato sostituito
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Mantieni le annotazioni JNI
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.jni.annotations.DoNotStrip *;
}

-dontwarn com.facebook.hermes.**
-dontwarn com.facebook.jni.**

# --- SOLOADER (Caricatore di librerie native) ---
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**

# --- FBJNI ---
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.jni.**

# --- GOOGLE MOBILE ADS ---
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# --- REACT NAVIGATION ---
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.**

# --- ASYNC STORAGE ---
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# --- SAFE AREA CONTEXT ---
-keep class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.th3rdwave.safeareacontext.**

# --- VECTOR ICONS ---
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

# --- REGOLE PER GETTER/SETTER ---
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
    void set*(***);
    *** get*();
}

# --- OKHTTP (usato da React Native) ---
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# --- FIREBASE/GOOGLE SERVICES ---
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# --- REGOLE GENERICHE PER ANDROID 15 (API 35) ---
# Alcune restrizioni aggiuntive per Android 15
-keep class android.** { *; }
-dontwarn android.**

# --- KOTLIN ---
-keep class kotlin.** { *; }
-dontwarn kotlin.**
-keep class kotlinx.** { *; }
-dontwarn kotlinx.**
