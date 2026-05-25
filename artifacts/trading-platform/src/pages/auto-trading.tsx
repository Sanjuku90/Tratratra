import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetAutoTradingPlans,
  useGetMyAutoSubscriptions,
  useCreateAutoSubscription,
  getGetMyAutoSubscriptionsQueryKey,
  type AutoTradingPlan,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Target,
  BarChart3,
} from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  starter: Shield,
  pro: Zap,
  elite: Star,
  vip: Crown,
};

const PLAN_GRADIENTS: Record<string, string> = {
  starter: "from-orange-900/20 to-orange-800/5 border-orange-700/30",
  pro: "from-slate-800/40 to-slate-700/10 border-slate-600/30",
  elite: "from-yellow-900/20 to-yellow-800/5 border-yellow-700/40",
  vip: "from-violet-900/20 to-violet-800/5 border-violet-700/40",
};

const PLAN_ACCENT: Record<string, string> = {
  starter: "text-orange-400",
  pro: "text-slate-300",
  elite: "text-yellow-400",
  vip: "text-violet-400",
};

const PLAN_BORDER_ACTIVE: Record<string, string> = {
  starter: "border-orange-500/60 shadow-orange-900/20",
  pro: "border-slate-500/60 shadow-slate-900/20",
  elite: "border-yellow-500/60 shadow-yellow-900/20",
  vip: "border-violet-500/60 shadow-violet-900/20",
};

const RISK_LABELS: Record<string, string> = {
  conservative: "Conservateur",
  moderate: "Modéré",
  aggressive: "Agressif",
};

const ASSET_LABELS: Record<string, string> = {
  crypto: "Crypto",
  forex: "Forex",
  stocks: "Actions",
  mixed: "Mixte (recommandé)",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  active: "border-green-500/40 text-green-400 bg-green-500/10",
  paused: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  completed: "border-primary/40 text-primary bg-primary/10",
  cancelled: "border-red-500/40 text-red-400 bg-red-500/10",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  paused: "En pause",
  completed: "Terminé",
  cancelled: "Annulé",
};

export default function AutoTradingPage() {
  const queryClient = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useGetAutoTradingPlans();
  const { data: subscriptions, isLoading: subsLoading } = useGetMyAutoSubscriptions();
  const createSub = useCreateAutoSubscription();

  const [selectedPlan, setSelectedPlan] = useState<AutoTradingPlan | null>(null);
  const [amount, setAmount] = useState("");
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [targetAssets, setTargetAssets] = useState<"crypto" | "forex" | "stocks" | "mixed">("mixed");
  const [duration, setDuration] = useState(1);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    const val = parseFloat(amount);
    if (!val || val < selectedPlan.minDeposit) return;

    createSub.mutate(
      {
        data: {
          planId: selectedPlan.id as "starter" | "pro" | "elite" | "vip",
          amount: val,
          riskLevel,
          targetAssets,
          durationMonths: duration,
        },
      },
      {
        onSuccess: () => {
          setSelectedPlan(null);
          setAmount("");
          queryClient.invalidateQueries({ queryKey: getGetMyAutoSubscriptionsQueryKey() });
          showFeedback(
            "Souscription enregistrée ! Notre équipe l'activera sous 24h après réception de votre dépôt.",
            true
          );
        },
        onError: () => {
          showFeedback("Erreur lors de la souscription. Vérifiez le montant minimum.", false);
        },
      }
    );
  };

  const activeSubs = (subscriptions ?? []).filter((s) => s.status === "active");
  const pendingSubs = (subscriptions ?? []).filter((s) => s.status === "pending");
  const totalProfit = activeSubs.reduce((acc, s) => acc + s.currentProfit, 0);
  const totalInvested = activeSubs.reduce((acc, s) => acc + s.amount, 0);

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(109,40,217,0.2)]">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trading Automatique</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nos algorithmes travaillent pour vous — sans effort, en continu.
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl text-sm font-medium border flex items-start gap-3 ${
            feedback.ok
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {feedback.ok ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            {feedback.msg}
          </div>
        )}

        {/* Active subscriptions summary */}
        {activeSubs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capital investi</p>
              <p className="text-2xl font-bold font-mono">${fmt(totalInvested)}</p>
            </Card>
            <Card className="border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Profit généré</p>
              <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalProfit >= 0 ? "+" : ""}${fmt(totalProfit)}
              </p>
            </Card>
            <Card className="border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bots actifs</p>
              <p className="text-2xl font-bold">{activeSubs.length}</p>
            </Card>
          </div>
        )}

        {/* Pending notice */}
        {pendingSubs.length > 0 && (
          <div className="flex gap-3 items-start p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-sm">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{pendingSubs.length} souscription{pendingSubs.length > 1 ? "s" : ""} en attente de validation</p>
              <p className="text-yellow-400/70 text-xs mt-0.5">Notre équipe activera votre plan sous 24h après réception du dépôt.</p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Choisissez votre plan
          </h2>

          {plansLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(plans ?? []).map((plan) => {
                const Icon = PLAN_ICONS[plan.id] ?? Shield;
                const isVip = plan.id === "vip";
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border bg-gradient-to-b p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-lg ${
                      PLAN_GRADIENTS[plan.id]
                    } ${isVip ? `${PLAN_BORDER_ACTIVE[plan.id]} shadow-xl` : ""}`}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setAmount(String(plan.minDeposit));
                    }}
                  >
                    {isVip && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-500/30 border border-violet-500/50 text-violet-300 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        Le plus populaire
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center bg-black/20 border ${
                        isVip ? "border-violet-500/30" : "border-white/10"
                      }`}>
                        <Icon className={`h-4 w-4 ${PLAN_ACCENT[plan.id]}`} />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${PLAN_ACCENT[plan.id]}`}>
                        {plan.name}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${plan.minDeposit}</span>
                        <span className="text-xs text-muted-foreground">min.</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>

                    <div className={`flex items-center gap-2 rounded-lg bg-black/20 p-2.5 border ${
                      isVip ? "border-violet-500/20" : "border-white/5"
                    }`}>
                      <TrendingUp className={`h-4 w-4 ${PLAN_ACCENT[plan.id]}`} />
                      <span className={`text-sm font-bold ${PLAN_ACCENT[plan.id]}`}>
                        {plan.monthlyReturnMin}–{plan.monthlyReturnMax}% / mois
                      </span>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-9 text-xs font-semibold ${
                        isVip
                          ? "bg-violet-600 hover:bg-violet-500 text-white"
                          : "bg-white/5 hover:bg-white/10 text-foreground border border-white/10"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                        setAmount(String(plan.minDeposit));
                      }}
                    >
                      Souscrire
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My subscriptions */}
        {(subscriptions ?? []).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Mes souscriptions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(subscriptions ?? []).map((sub) => {
                const profitPct = sub.amount > 0 ? ((sub.currentProfit / sub.amount) * 100).toFixed(2) : "0.00";
                return (
                  <Card key={sub.id} className="border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold">{sub.planName}</p>
                          <Badge variant="outline" className={STATUS_STYLE[sub.status]}>
                            {STATUS_LABEL[sub.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {RISK_LABELS[sub.riskLevel]} · {ASSET_LABELS[sub.targetAssets]} · {sub.durationMonths} mois
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Capital</p>
                        <p className="font-bold font-mono">${fmt(sub.amount)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Profit</p>
                        <p className={`text-lg font-bold font-mono ${sub.currentProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {sub.currentProfit >= 0 ? "+" : ""}${fmt(sub.currentProfit)}
                        </p>
                        <p className="text-xs text-muted-foreground">{profitPct}%</p>
                      </div>
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Durée</p>
                        <p className="text-lg font-bold">{sub.durationMonths} mois</p>
                        {sub.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expire {new Date(sub.expiresAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>

                    {sub.adminNote && (
                      <p className="mt-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
                        {sub.adminNote}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* How it works */}
        <Card className="border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Comment ça fonctionne ?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Choisissez un plan",
                desc: "Sélectionnez le grade qui correspond à votre budget et objectifs de rendement.",
              },
              {
                step: "2",
                title: "Effectuez votre dépôt",
                desc: "Envoyez votre dépôt à l'adresse crypto fournie — minimum $49.99 pour le plan Starter.",
              },
              {
                step: "3",
                title: "Le bot travaille pour vous",
                desc: "Après validation, nos algorithmes tradent 24/7. Vous suivez vos gains en temps réel.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Subscription dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(o) => !o && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Souscrire au plan {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-5 pt-2">
              {/* Plan summary */}
              <div className={`rounded-xl border bg-gradient-to-b p-4 ${PLAN_GRADIENTS[selectedPlan.id]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${PLAN_ACCENT[selectedPlan.id]}`}>{selectedPlan.name}</span>
                  <span className={`text-sm font-bold ${PLAN_ACCENT[selectedPlan.id]}`}>
                    {selectedPlan.monthlyReturnMin}–{selectedPlan.monthlyReturnMax}% / mois
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
              </div>

              {/* Deposit info */}
              <div className="flex gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Envoyez votre dépôt à <strong className="font-mono">TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS</strong> avant de valider.
                </span>
              </div>

              {/* Amount */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Montant déposé (min. ${selectedPlan.minDeposit})
                </Label>
                <Input
                  type="number"
                  placeholder={`${selectedPlan.minDeposit}`}
                  min={selectedPlan.minDeposit}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-card border-border font-mono"
                />
              </div>

              {/* Risk Level */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Niveau de risque</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["conservative", "moderate", "aggressive"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRiskLevel(r)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        riskLevel === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {RISK_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Assets */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Actifs cibles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["crypto", "forex", "stocks", "mixed"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setTargetAssets(a)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        targetAssets === a
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {ASSET_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Durée du contrat</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-colors ${
                        duration === d
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {d} mois
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated returns */}
              {amount && parseFloat(amount) >= selectedPlan.minDeposit && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Estimation sur {duration} mois :</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rendement minimum</span>
                    <span className="font-bold text-green-400">
                      +${fmt(parseFloat(amount) * (selectedPlan.monthlyReturnMin / 100) * duration)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Rendement maximum</span>
                    <span className="font-bold text-green-400">
                      +${fmt(parseFloat(amount) * (selectedPlan.monthlyReturnMax / 100) * duration)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSubscribe}
                disabled={createSub.isPending || !amount || parseFloat(amount) < selectedPlan.minDeposit}
              >
                {createSub.isPending ? "Traitement..." : "Confirmer la souscription"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
