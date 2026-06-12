import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyAI",
  description: "AI-powered learning platform for students",
};

// Runs synchronously before React hydration to prevent flash of wrong theme
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme'),c=localStorage.getItem('colorTheme'),e=document.documentElement;if(t==='dark')e.classList.add('dark');if(c&&c!=='blue')e.setAttribute('data-theme',c)}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster richColors closeButton position="bottom-right" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
