import { useLocation, useNavigate } from "react-router-dom";
import { Home, Mic, MessageSquare, Camera, CloudSun, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, labelKey: "home" },
  { path: "/voice", icon: Mic, labelKey: "voiceAdvisory" },
  { path: "/chat", icon: MessageSquare, labelKey: "textChat" },
  { path: "/scan", icon: Camera, labelKey: "scanCrop" },
  { path: "/weather", icon: CloudSun, labelKey: "weather" },
  { path: "/knowledge", icon: BookOpen, labelKey: "knowledgeBase" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1">
        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] transition-colors",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="truncate max-w-[56px]">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
