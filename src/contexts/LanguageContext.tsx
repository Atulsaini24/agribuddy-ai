import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "hi" | "ta" | "te" | "kn" | "mr" | "bn";

interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  icon: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", icon: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", icon: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", icon: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", icon: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", icon: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", icon: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", icon: "🇮🇳" },
];

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  appName: { en: "KisanMitra", hi: "किसानमित्र", ta: "KisanMitra", te: "KisanMitra", kn: "KisanMitra", mr: "किसानमित्र", bn: "কিসানমিত্র" },
  tagline: {
    en: "Your AI Farm Advisor",
    hi: "आपका AI कृषि सलाहकार",
    ta: "உங்கள் AI விவசாய ஆலோசகர்",
    te: "మీ AI వ్యవసాయ సలహాదారు",
    kn: "ನಿಮ್ಮ AI ಕೃಷಿ ಸಲಹೆಗಾರ",
    mr: "तुमचा AI शेती सल्लागार",
    bn: "আপনার AI কৃষি উপদেষ্টা",
  },
  startAdvisory: {
    en: "Start Advisory",
    hi: "सलाह शुरू करें",
    ta: "ஆலோசனை தொடங்கு",
    te: "సలహా ప్రారంభించండి",
    kn: "ಸಲಹೆ ಪ್ರಾರಂಭಿಸಿ",
    mr: "सल्ला सुरू करा",
    bn: "পরামর্শ শুরু করুন",
  },
  scanCrop: {
    en: "Scan Crop",
    hi: "फसल स्कैन करें",
    ta: "பயிர் ஸ்கேன்",
    te: "పంట స్కాన్",
    kn: "ಬೆಳೆ ಸ್ಕ್ಯಾನ್",
    mr: "पीक स्कॅन करा",
    bn: "ফসল স্ক্যান",
  },
  textChat: {
    en: "Text Chat",
    hi: "टेक्स्ट चैट",
    ta: "உரை அரட்டை",
    te: "టెక్స్ట్ చాట్",
    kn: "ಪಠ್ಯ ಚಾಟ್",
    mr: "मजकूर चॅट",
    bn: "টেক্সট চ্যাট",
  },
  weather: {
    en: "Weather",
    hi: "मौसम",
    ta: "வானிலை",
    te: "వాతావరణం",
    kn: "ಹವಾಮಾನ",
    mr: "हवामान",
    bn: "আবহাওয়া",
  },
  knowledgeBase: {
    en: "Knowledge Base",
    hi: "ज्ञान भंडार",
    ta: "அறிவுத் தளம்",
    te: "జ్ఞాన భాండాగారం",
    kn: "ಜ್ಞಾನ ಸಂಗ್ರಹ",
    mr: "ज्ञान भांडार",
    bn: "জ্ঞান ভাণ্ডার",
  },
  selectLanguage: {
    en: "Select Language",
    hi: "भाषा चुनें",
    ta: "மொழியைத் தேர்ந்தெடுக்கவும்",
    te: "భాషను ఎంచుకోండి",
    kn: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
    mr: "भाषा निवडा",
    bn: "ভাষা নির্বাচন করুন",
  },
  voiceAdvisory: {
    en: "Voice Advisory",
    hi: "वॉइस सलाह",
    ta: "குரல் ஆலோசனை",
    te: "వాయిస్ సలహా",
    kn: "ಧ್ವನಿ ಸಲಹೆ",
    mr: "व्हॉइस सल्ला",
    bn: "ভয়েস পরামর্শ",
  },
  home: {
    en: "Home",
    hi: "होम",
    ta: "முகப்பு",
    te: "హోమ్",
    kn: "ಮುಖಪುಟ",
    mr: "होम",
    bn: "হোম",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("kisanmitra-lang");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("kisanmitra-lang", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
