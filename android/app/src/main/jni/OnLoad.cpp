#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

// Forward declarations per i simboli generati dall'autolinking Gradle (rncli.cpp).
// Evitano la dipendenza compile-time da rncli.h (che può mancare dalla cache Gradle).
// I simboli sono risolti al link-time da rncli.cpp incluso da ReactNative-application.cmake.

// rncli_ModuleProvider è nel namespace facebook::react (come dichiarato in rncli.h).
namespace facebook {
namespace react {
struct TurboModule;
class CallInvoker;
std::shared_ptr<TurboModule> rncli_ModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker);
} // namespace react
} // namespace facebook

// rncli_registerProviders è nel namespace globale (come dichiarato in rncli.h).
void rncli_registerProviders(
    std::shared_ptr<facebook::react::ComponentDescriptorProviderRegistry const>);

namespace facebook {
namespace react {

// Registra i componenti Fabric delle librerie autolinked (gesture-handler, screens, ecc.).
void registerComponents(
    std::shared_ptr<ComponentDescriptorProviderRegistry const> registry) {
  rncli_registerProviders(registry);
}

} // namespace react
} // namespace facebook

// JNI_OnLoad: punto di ingresso JNI caricato automaticamente dalla JVM.
// Inizializza la New Architecture (Fabric + TurboModules) per React Native 0.76.
//
// API corretta per RN 0.76:
// - DefaultTurboModuleManagerDelegate::moduleProvidersFromEntryPoint (function pointer statico)
// - DefaultComponentsRegistry::registerComponentDescriptorsFromEntryPoint (function pointer statico)
// Il vecchio pattern setManagerProvider() è stato rimosso in RN 0.76.
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::
        moduleProvidersFromEntryPoint = facebook::react::rncli_ModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            facebook::react::registerComponents;
  });
}
