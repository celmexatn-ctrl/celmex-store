(() => {
  "use strict";

  const capacitor =
    window.Capacitor ||
    globalThis.Capacitor;

  const nativeByCapacitor =
    Boolean(
      capacitor?.isNativePlatform?.()
    );

  const nativeByProtocol =
    location.protocol === "capacitor:";

  const isNativeApp =
    nativeByCapacitor ||
    nativeByProtocol;

  window.EDNativeApp = {
    isNative: isNativeApp,
    platform:
      capacitor?.getPlatform?.() ||
      (isNativeApp ? "android" : "web")
  };

  document.documentElement.classList.toggle(
    "ed-native-app",
    isNativeApp
  );

  document.documentElement.classList.toggle(
    "ed-web-app",
    !isNativeApp
  );

  if (isNativeApp) {
    document.documentElement.setAttribute(
      "data-ed-platform",
      window.EDNativeApp.platform
    );
  }

  console.log(
    isNativeApp
      ? "✓ E&D Market ejecutándose como app nativa"
      : "✓ E&D Market ejecutándose como web"
  );
})();
