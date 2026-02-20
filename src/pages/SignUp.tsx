import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SignUp = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Signup failed");
            }

            toast.success("Account created successfully! Please login.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Error creating account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background p-6">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/")}
                    className="rounded-full"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex flex-1 flex-col justify-center max-w-md mx-auto w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">{t("Sign Up")}</h1>
                    <p className="text-muted-foreground">{t("Create an account to get started")}</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">{t("Full Name")}</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="John Doe"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("Email")}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t("Password")}</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t("Sign Up")}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">
                        {t("Already have an account?")}{" "}
                    </span>
                    <Button
                        variant="link"
                        className="p-0 text-primary"
                        onClick={() => navigate("/login")}
                    >
                        {t("Sign In")}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
