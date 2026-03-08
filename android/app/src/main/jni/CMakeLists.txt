cmake_minimum_required(VERSION 3.13)

# Definisce il nome della libreria JNI dell'app.
project(segnapunti)

# Questo file include tutto il necessario per compilare l'app React Native
# con la New Architecture (Fabric + TurboModules).
#
# ReactNative-application.cmake compila le librerie JNI core della New Architecture,
# tra cui libreact_featureflagsjni.so, richiesta da DefaultNewArchitectureEntryPoint.load().
# Senza questo file, libreact_featureflagsjni.so non viene mai compilata e l'app
# crasha con UnsatisfiedLinkError su tutti i dispositivi, incluso HyperOS 2.0.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
