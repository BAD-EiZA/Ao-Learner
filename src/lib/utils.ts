export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function languageLabel(
  language: "ENGLISH" | "GERMAN" | "FRENCH" | string
) {
  if (language === "FRENCH") return "Français";
  if (language === "GERMAN") return "Deutsch";
  return "English";
}
