declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_NUMBER__: string;

export const APP_VERSION = __APP_VERSION__;
export const BUILD_DATE = __BUILD_DATE__;
export const BUILD_NUMBER = __BUILD_NUMBER__;

export function formatBuildDate(iso: string = BUILD_DATE): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}
