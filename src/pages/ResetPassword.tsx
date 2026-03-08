import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via reset link — stay on this page
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t("common.error"), description: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t("common.error"), description: t("auth.passwordTooShort"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-6">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t("auth.passwordUpdated")}</h2>
              <p className="text-sm text-muted-foreground">{t("auth.redirecting")}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{t("auth.resetPassword")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("auth.resetPasswordDesc")}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t("auth.newPassword")}</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required minLength={6} />
                </div>
                <div>
                  <Label>{t("auth.confirmPassword")}</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t("auth.updatePassword")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
