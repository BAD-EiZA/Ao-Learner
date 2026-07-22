export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function languageLabel(
  language:
    | "ENGLISH"
    | "GERMAN"
    | "FRENCH"
    | "SPANISH"
    | "ITALIAN"
    | "PORTUGUESE"
    | string
) {
  if (language === "PORTUGUESE") return "Português";
  if (language === "ITALIAN") return "Italiano";
  if (language === "SPANISH") return "Español";
  if (language === "FRENCH") return "Français";
  if (language === "GERMAN") return "Deutsch";
  return "English";
}
