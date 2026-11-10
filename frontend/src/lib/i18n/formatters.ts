import { SupportedLanguage } from "./types";

const LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  bn: "bn-IN",
  mr: "mr-IN",
};

export function formatCurrency(amount: number, lang: SupportedLanguage = "en"): string {
  try {
    const locale = LOCALE_MAP[lang] || "en-IN";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatNumber(num: number, lang: SupportedLanguage = "en"): string {
  try {
    const locale = LOCALE_MAP[lang] || "en-IN";
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return num.toLocaleString();
  }
}

export function formatDate(
  date: string | number | Date,
  lang: SupportedLanguage = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const locale = LOCALE_MAP[lang] || "en-IN";
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    return String(date);
  }
}

export function formatTime(
  date: string | number | Date = new Date(),
  lang: SupportedLanguage = "en"
): string {
  try {
    const locale = LOCALE_MAP[lang] || "en-IN";
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return new Date().toLocaleTimeString();
  }
}

