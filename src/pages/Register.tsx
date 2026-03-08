import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INTEREST_OPTIONS = [
  "fashion", "electronics", "sports", "beauty", "home", "books", "toys", "food",
];

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // If customer, save preferences after signup
      if (role === "customer" && data.user) {
        await supabase.from("customer_preferences").insert({
          user_id: data.user.id,
          gender: gender || null,
          age_range: ageRange || null,
          interests,
        });
      }

      toast({
        title: t("auth.signup"),
        description: t("auth.checkEmail"),
      });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t("auth.signup")}</h2>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                role === "customer"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-sm font-medium">{t("auth.roleCustomer")}</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                role === "seller"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Store className="h-6 w-6" />
              <span className="text-sm font-medium">{t("auth.roleSeller")}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("auth.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.namePlaceholder")} className="mt-1.5" required />
            </div>
            <div>
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" required />
            </div>
            <div>
              <Label>{t("auth.phone")}</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213 xxx xxx xxx" className="mt-1.5" />
            </div>
            <div>
              <Label>{t("auth.password")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required minLength={6} />
            </div>

            {/* Customer Preferences for Recommendation */}
            {role === "customer" && (
              <div className="space-y-4 pt-2 border-t">
                <p className="text-sm font-medium text-foreground">{t("auth.preferencesTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("auth.preferencesDesc")}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("auth.gender")}</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder={t("auth.selectGender")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t("auth.male")}</SelectItem>
                        <SelectItem value="female">{t("auth.female")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("auth.ageRange")}</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder={t("auth.selectAge")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35-44">35-44</SelectItem>
                        <SelectItem value="45+">45+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t("auth.interests")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {INTEREST_OPTIONS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          interests.includes(interest)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {t(`interest.${interest}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {role === "seller" ? t("auth.signupAsSeller") : t("auth.signup")}
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
