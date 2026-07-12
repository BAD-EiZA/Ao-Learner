export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function languageLabel(language: "ENGLISH" | "GERMAN") {
  return language === "ENGLISH" ? "English" : "Deutsch";
}
