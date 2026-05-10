import Constants from "expo-constants";

const configuredApiUrl =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined)?.trim() ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.trim();

export const API_BASE_URL =
  configuredApiUrl ||
  "http://localhost:3000";
