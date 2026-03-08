#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <rncli.h>

namespace facebook {
namespace react {

// Registra i componenti Fabric (New Architecture) delle librerie native collegate.
// rncli_registerProviders è generato automaticamente dall'autolinking React Native
// e include tutti i componenti Fabric dei package npm installati.
void registerComponents(
    std::shared_ptr<ComponentDescriptorProviderRegistry const> registry) {
  rncli_registerProviders(registry);
}

// Fornisce i TurboModule delle librerie native collegate.
// Per i TurboModule custom aggiungere qui i casi specifici.
// rncli_init() inizializza i TurboModule autolinkati.
std::shared_ptr<TurboModule> provideNativeTurboModule(
    std::string const& name,
    std::shared_ptr<CallInvoker> jsInvoker) {
  return nullptr;
}

} // namespace react
} // namespace facebook

// JNI_OnLoad viene chiamato automaticamente dalla JVM quando la libreria nativa
// dell'app (libsegnapunti.so) viene caricata.
// Inizializza il TurboModule manager e il component registry per la New Architecture.
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::setManagerProvider(
        [](jsi::Runtime& runtime,
           std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
          return facebook::react::DefaultTurboModuleManagerDelegate::
              getTurboModule(runtime, jsInvoker, facebook::react::provideNativeTurboModule);
        });
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            facebook::react::registerComponents;
    rncli_init();
  });
}
