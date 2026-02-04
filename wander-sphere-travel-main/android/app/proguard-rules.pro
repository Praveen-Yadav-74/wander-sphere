# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ========================================
# Capacitor Core Rules
# ========================================

# Keep the Bridge class and Capacitor core classes
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Keep all Capacitor plugin classes
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all plugin methods annotated with @PluginMethod
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# Keep plugin method parameter types
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <methods>;
}

# ========================================
# AndroidX and Google Libraries
# ========================================

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ========================================
# WebView and JavaScript Bridge
# ========================================

# Keep WebView classes
-keep class android.webkit.** { *; }
-keepclassmembers class android.webkit.** { *; }

# Keep JavaScript interface classes (critical for Capacitor)
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Keep classes that might be used in JavaScript
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ========================================
# Serialization and Parcelable
# ========================================

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ========================================
# Debugging and Crash Reporting
# ========================================

# Keep source file names and line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable

# Keep custom exceptions for crash reporting
-keep public class * extends java.lang.Exception

# Rename source file attribute to obfuscate original file names
-renamesourcefileattribute SourceFile

# ========================================
# Reflection
# ========================================

# Keep classes accessed via reflection
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ========================================
# Native Methods
# ========================================

# Keep native methods
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# ========================================
# Enums
# ========================================

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ========================================
# R8 Optimizations
# ========================================

# Don't warn about missing classes (common in multi-module projects)
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Optimization settings
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# ========================================
# Project Specific Rules
# ========================================

# Keep your main application class
-keep class com.onenomadsolutions.app.MainActivity { *; }

# Add any additional app-specific rules below this line
# Example: Keep specific models or data classes if needed
# -keep class com.yourapp.models.** { *; }
