#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <rncli.h>

namespace facebook {
namespace react {

void registerComponents(
    std::shared_ptr<ComponentDescriptorProviderRegistry const> registry) {
  rncli_registerProviders(registry);
}

// Provider per moduli C++ puri (nessuno in questo progetto).
std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& /*name*/,
    const std::shared_ptr<CallInvoker>& /*jsInvoker*/) {
  return nullptr;
}

// Provider per moduli Java/Kotlin via autolinking.
// javaModuleProvider accetta JavaTurboModule::InitParams (non shared_ptr<CallInvoker>).
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
