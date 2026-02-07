import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";

const TextChat = () => {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background pb-20">
      <h1 className="text-2xl font-bold">{t("textChat")}</h1>
      <p className="text-muted-foreground mt-2">Coming soon...</p>
      <BottomNav />
    </div>
  );
};

export default TextChat;
