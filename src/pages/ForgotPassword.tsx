import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t("auth.resetEmailSent")}</h2>
              <p className="text-sm text-muted-foreground">{t("auth.resetEmailDesc")}</p>
              <Link to="/auth">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t("auth.backToSignin")}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{t("auth.forgotPassword")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("auth.forgotPasswordDesc")}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t("auth.email")}</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t("auth.sendResetLink")}
                </Button>
              </form>
              <p className="text-sm text-center text-muted-foreground mt-4">
                <Link to="/auth" className="text-primary font-medium hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5 inline me-1" />
                  {t("auth.backToSignin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
