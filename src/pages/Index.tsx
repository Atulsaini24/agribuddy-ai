import { useNavigate } from "react-router-dom";
import { Mic, Camera, MessageSquare, CloudSun, BookOpen, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from local storage", error);
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 relative">
      <div className="absolute top-4 right-4 z-10">
        {user ? (
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold shadow-md cursor-pointer" onClick={() => navigate("/profile")}>
            {user.email?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md transition-all hover:scale-105"
            size="lg"
            onClick={() => navigate("/login")}
          >
            {t("Login/Signup")}
          </Button>
        )}
      </div>
      {/* Hero Section */}
      <header className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg"
        >
          <Sprout className="h-10 w-10 text-primary-foreground" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-foreground"
        >
          {t("appName")}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-lg text-muted-foreground"
        >
          {t("tagline")}
        </motion.p>
      </header>

      {/* Language Selector */}
      <section className="px-6 pb-6">
        <p className="mb-3 text-sm font-medium text-muted-foreground text-center">
          {t("selectLanguage")}
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-all ${language === lang.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
            >
              <span className="text-lg">{lang.icon}</span>
              <span className="truncate">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Primary Actions */}
      <section className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              className="h-24 w-full flex-col gap-2 rounded-2xl text-base shadow-md"
              onClick={() => navigate("/voice")}
            >
              <Mic className="h-8 w-8" />
              {t("startAdvisory")}
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              variant="secondary"
              className="h-24 w-full flex-col gap-2 rounded-2xl text-base shadow-md"
              onClick={() => navigate("/scan")}
            >
              <Camera className="h-8 w-8" />
              {t("scanCrop")}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Secondary Actions */}
      <section className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <button
              onClick={() => navigate("/chat")}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-foreground">{t("textChat")}</span>
            </button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <button
              onClick={() => navigate("/weather")}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <CloudSun className="h-6 w-6 text-sky" />
              <span className="text-xs font-medium text-foreground">{t("weather")}</span>
            </button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <button
              onClick={() => navigate("/knowledge")}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <BookOpen className="h-6 w-6 text-earth" />
              <span className="text-xs font-medium text-foreground">{t("knowledgeBase")}</span>
            </button>
          </motion.div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;
