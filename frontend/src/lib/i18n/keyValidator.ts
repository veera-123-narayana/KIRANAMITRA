import en from "@/messages/en.json";
import te from "@/messages/te.json";
import hi from "@/messages/hi.json";
import ta from "@/messages/ta.json";
import kn from "@/messages/kn.json";
import ml from "@/messages/ml.json";
import bn from "@/messages/bn.json";
import mr from "@/messages/mr.json";

function getFlatKeys(obj: any, prefix = ""): string[] {
  let keys: string[] = [];
  for (const k in obj) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === "object" && obj[k] !== null) {
      keys = keys.concat(getFlatKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

export function validateAllLanguageKeys(): {
  isValid: boolean;
  missingByLanguage: Record<string, string[]>;
} {
  const masterKeys = getFlatKeys(en);
  const languages: Record<string, any> = {
    te,
    hi,
    ta,
    kn,
    ml,
    bn,
    mr,
  };

  const missingByLanguage: Record<string, string[]> = {};
  let isValid = true;

  for (const [langCode, dict] of Object.entries(languages)) {
    const langKeys = new Set(getFlatKeys(dict));
    const missing: string[] = [];
    for (const key of masterKeys) {
      if (!langKeys.has(key)) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      isValid = false;
      missingByLanguage[langCode] = missing;
    }
  }

  return { isValid, missingByLanguage };
}

