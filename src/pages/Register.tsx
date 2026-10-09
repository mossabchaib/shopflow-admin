import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({
        title: t("auth.signup"),
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          aria-label="Ü R V O X Home"
          className="flex flex-col items-center mb-8"
        >
          <img
            src="/Logo.png"
            alt="Ü R V O X Logo"
            className="h-16 w-16 object-contain mb-4"
          />
          <h1 className="text-2xl font-bold tracking-[0.18em] text-foreground">
            Ü R V O X
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.ecommerce")}</p>
        </Link>

        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t("auth.signup")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("auth.name")}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="mt-1.5" required />
            </div>
            <div>
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" required />
            </div>
            <div>
              <Label>{t("auth.password")}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("auth.signup")}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            {t("auth.hasAccount")}{" "}
            <Link to="/auth" className="text-primary font-medium hover:underline">
              {t("auth.signin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;