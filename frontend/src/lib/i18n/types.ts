export type SupportedLanguage = "en" | "te" | "hi" | "ta" | "kn" | "ml" | "bn" | "mr";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  localeCode: string;
  voiceLangCode: string; // e.g. "te-IN", "hi-IN", "en-IN"
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", localeCode: "en-IN", voiceLangCode: "en-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", localeCode: "te-IN", voiceLangCode: "te-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", localeCode: "hi-IN", voiceLangCode: "hi-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", localeCode: "ta-IN", voiceLangCode: "ta-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", localeCode: "kn-IN", voiceLangCode: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", localeCode: "ml-IN", voiceLangCode: "ml-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", localeCode: "bn-IN", voiceLangCode: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", localeCode: "mr-IN", voiceLangCode: "mr-IN" },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

