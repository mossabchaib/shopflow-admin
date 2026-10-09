import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const Auth = () => {
  const navigate = useNavigate();

  const { toast } = useToast();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error("Login succeeded but no session was returned.");
      }

      console.log("LOGIN SUCCESS:", {
        userId: data.user.id,
        email: data.user.email,
      });

      /*
       * Do NOT manually update AuthProvider here.
       *
       * Supabase emits SIGNED_IN.
       * AuthProvider receives it through onAuthStateChange().
       */

      navigate("/", { replace: true });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in.";

      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
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

          <p className="text-sm text-muted-foreground mt-1">
            {t("auth.ecommerce")}
          </p>
        </Link>

        {/* Login Card */}
        <div className="dashboard-card p-6">

          <h2 className="text-lg font-semibold text-foreground mb-6">
            {t("auth.signin")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <Label htmlFor="email">
                {t("auth.email")}
              </Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-1.5"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">
                {t("auth.password")}
              </Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                autoComplete="current-password"
                minLength={6}
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              )}

              {t("auth.signin")}
            </Button>

          </form>

          {/* Register */}
          <p className="text-sm text-center text-muted-foreground mt-4">
            {t("auth.noAccount")}{" "}

            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              {t("auth.signup")}
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Auth;