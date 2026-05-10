const variant = process.env.APP_VARIANT === "prod" ? "prod" : "dev";
const isProd = variant === "prod";

const defaultProdApiUrl = "https://api.vinotheque.ch";
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  (isProd ? defaultProdApiUrl : "http://localhost:3000");

export default {
  expo: {
    name: isProd ? "Vinotheque Prod" : "Vinotheque Dev",
    slug: isProd ? "vinotheque" : "vinotheque-dev",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: isProd ? "vinotheque" : "vinotheque-dev",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1a0500",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isProd ? "ch.vinotheque.app" : "ch.vinotheque.app.dev",
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Vinotheque benötigt Zugriff auf deine Fotos, um Weinbilder hinzuzufügen.",
        NSCameraUsageDescription:
          "Vinotheque benötigt Kamerazugriff, um Weinetiketten zu fotografieren.",
        NSPhotoLibraryAddUsageDescription:
          "Vinotheque möchte Fotos in deine Bibliothek speichern.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a0500",
      },
      package: isProd ? "ch.vinotheque.app" : "ch.vinotheque.app.dev",
    },
    web: {
      bundler: "metro",
      output: "static",
    },
    plugins: [
      "./plugins/withCxxLanguageStandard",
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Vinotheque benötigt Zugriff auf deine Fotos, um Weinbilder hinzuzufügen.",
          cameraPermission:
            "Vinotheque benötigt Kamerazugriff, um Weinetiketten zu fotografieren.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appVariant: variant,
      apiUrl,
    },
  },
};
