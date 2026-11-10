import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { SettingsProvider } from "@/lib/settings/SettingsContext";
import { LanguageOnboardingModal } from "@/components/onboarding/LanguageOnboardingModal";

export const metadata: Metadata = {
  title: "KIRANAMITRA AI – Autonomous Intelligence Network for Local Commerce",
  description:
    "From Individual Shops to an Intelligent, Self-Coordinating Economy powered by Gnani AI Speech and Multi-Agent Collective Intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700&family=Noto+Sans+Telugu:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@300;400;500;600;700&family=Noto+Sans+Tamil:wght@300;400;500;600;700&family=Noto+Sans+Kannada:wght@300;400;500;600;700&family=Noto+Sans+Malayalam:wght@300;400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-originos-bg text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">
        <SettingsProvider>
          <LanguageProvider>
            <LanguageOnboardingModal />
            {children}
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
