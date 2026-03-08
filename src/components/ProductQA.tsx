import { useEffect, useState } from "react";
import { MessageCircleQuestion, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface Props { productId: string; }

export function ProductQA({ productId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newAnswers, setNewAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchQA = async () => {
    const { data: qs } = await supabase
      .from("product_questions")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (!qs || qs.length === 0) { setQuestions([]); return; }

    // Fetch answers
    const qIds = qs.map(q => q.id);
    const { data: answers } = await supabase
      .from("product_answers")
      .select("*")
      .in("question_id", qIds)
      .order("created_at");

    // Fetch profiles
    const userIds = [...new Set([...qs.map(q => q.user_id), ...(answers || []).map(a => a.user_id)])];
    const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profMap = new Map((profs || []).map(p => [p.user_id, p]));

    setQuestions(qs.map(q => ({
      ...q,
      profile: profMap.get(q.user_id),
      answers: (answers || []).filter(a => a.question_id === q.id).map(a => ({ ...a, profile: profMap.get(a.user_id) })),
    })));
  };

  useEffect(() => { fetchQA(); }, [productId]);

  const askQuestion = async () => {
    if (!user) { toast({ title: t("common.pleaseSignIn"), variant: "destructive" }); return; }
    if (!newQ.trim()) return;
    setSubmitting(true);
    await supabase.from("product_questions").insert({ product_id: productId, user_id: user.id, question: newQ.trim() });
    setNewQ("");
    await fetchQA();
    setSubmitting(false);
  };

  const submitAnswer = async (qId: string) => {
    if (!user) { toast({ title: t("common.pleaseSignIn"), variant: "destructive" }); return; }
    const text = newAnswers[qId]?.trim();
    if (!text) return;
    setSubmitting(true);
    await supabase.from("product_answers").insert({ question_id: qId, user_id: user.id, answer: text });
    setNewAnswers(p => ({ ...p, [qId]: "" }));
    await fetchQA();
    setSubmitting(false);
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircleQuestion className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{t("qa.title")}</h2>
        <span className="text-sm text-muted-foreground">({questions.length})</span>
      </div>

      {/* Ask question */}
      {user && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/20">
          <Textarea
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
            placeholder={t("qa.askPlaceholder")}
            rows={2}
            className="mb-3 resize-none"
          />
          <Button onClick={askQuestion} disabled={submitting} size="sm">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {t("qa.ask")}
          </Button>
        </div>
      )}

      {/* Questions list */}
      {questions.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">{t("qa.noQuestions")}</p>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="p-4 rounded-xl border border-border/50 bg-card">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {(q.profile?.name || "?")?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{q.profile?.name || "User"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{q.question}</p>
                </div>
              </div>

              {/* Answers */}
              {q.answers.length > 0 && (
                <div className="ms-11 space-y-2 mb-3">
                  {q.answers.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">{a.profile?.name || "User"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground">{a.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer form */}
              {user && (
                <div className="ms-11 flex gap-2">
                  <Textarea
                    value={newAnswers[q.id] || ""}
                    onChange={e => setNewAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    placeholder={t("qa.answerPlaceholder")}
                    rows={1}
                    className="resize-none text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={() => submitAnswer(q.id)} disabled={submitting}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
