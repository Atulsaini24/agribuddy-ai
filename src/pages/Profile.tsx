import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, LogOut, User, Mail, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Profile = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse user from local storage", error);
            }
        } else {
            navigate("/login");
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.success("Logged out successfully");
        navigate("/");
    };

    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col bg-background p-6">
            <div className="mb-6 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/")}
                    className="rounded-full"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">{t("Profile")}</h1>
            </div>

            <div className="flex flex-1 flex-col max-w-md mx-auto w-full space-y-8 py-8">
                <div className="flex flex-col items-center gap-4 py-6">
                    <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-lg">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-4 bg-card p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("Full Name")}</p>
                            <p className="font-semibold">{user.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("Email")}</p>
                            <p className="font-semibold">{user.email}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <Button
                        variant="destructive"
                        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl shadow-md transition-all active:scale-95"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        {t("Logout")}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
