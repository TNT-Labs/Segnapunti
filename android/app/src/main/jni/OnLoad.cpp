#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <autolinking.h>

// autolinking.h è generato da @react-native/gradle-plugin e dichiara:
//   autolinking_ModuleProvider    (java/kotlin modules)
//   autolinking_cxxModuleProvider (C++ modules, restituisce nullptr)
//   autolinking_registerProviders (componenti Fabric)
// Tutti nel namespace facebook::react.

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::autolinking_cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::autolinking_ModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::autolinking_registerProviders;
  });
}
