# --- REGOLE GENERALI REACT NATIVE ---
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.react.bridge.JavaScriptModule

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

# --- HERMES & JNI (Cruciale per il tuo errore) ---
# Impedisce a ProGuard di rimuovere le classi che caricano libhermes_executor.so
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.jni.annotations.DoNotStrip *;
}

-dontwarn com.facebook.hermes.**
-dontwarn com.facebook.jni.**

# --- SOLOADER (Il caricatore di librerie native) ---
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**

# --- GOOGLE MOBILE ADS ---
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# --- REGOLE AGGIUNTIVE PER LE CLASSI SETTER/GETTER ---
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

# --- JSC (JavaScriptCore) - Using JSC instead of Hermes ---
-keep class com.facebook.jsc.** { *; }
-dontwarn com.facebook.jsc.**

# Keep all WebKit classes used by JSC
-keep class org.webkit.** { *; }
-dontwarn org.webkit.**
