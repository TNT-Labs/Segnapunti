#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

// Forward declarations per i simboli generati dall'autolinking (rncli.cpp).
// Non includiamo rncli.h perché il task di autolinking può girare FROM-CACHE
// e non rigenerare il file su disco.
// JavaTurboModule::InitParams è già disponibile tramite DefaultTurboModuleManagerDelegate.h.

namespace facebook {
namespace react {

// rncli_ModuleProvider usa JavaTurboModule::InitParams (firma corretta per RN 0.76).
std::shared_ptr<TurboModule> rncli_ModuleProvider(
    const std::string& moduleName,
    const JavaTurboModule::InitParams& params);

} // namespace react
} // namespace facebook

// rncli_registerProviders è nel namespace globale.
void rncli_registerProviders(
    std::shared_ptr<facebook::react::ComponentDescriptorProviderRegistry const> registry);

namespace facebook {
namespace react {

void registerComponents(
    std::shared_ptr<ComponentDescriptorProviderRegistry const> registry) {
  rncli_registerProviders(registry);
}

// Provider C++ puri: nessuno in questo progetto.
std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& /*name*/,
    const std::shared_ptr<CallInvoker>& /*jsInvoker*/) {
  return nullptr;
}

// Provider Java/Kotlin via autolinking.
std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
  return rncli_ModuleProvider(name, params);
}

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::registerComponents;
  });
}
