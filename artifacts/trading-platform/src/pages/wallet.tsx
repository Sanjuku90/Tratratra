import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetWalletBalance,
  useGetTransactions,
  useDeposit,
  useWithdraw,
} from "@workspace/api-client-react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Building2, Bitcoin, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type DepositMethod = "card" | "bank_transfer" | "crypto";
type WithdrawMethod = "bank_transfer" | "crypto";

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("card");
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>("bank_transfer");
  const [message, setMessage] = useState("");

  const { data: balance, isLoading: balanceLoading } = useGetWalletBalance();
  const { data: transactions, isLoading: txLoading } = useGetTransactions();
  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
  };

  const handleDeposit = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    depositMutation.mutate(
      { data: { amount: val, method: depositMethod } },
      {
        onSuccess: () => {
          setDepositOpen(false);
          setAmount("");
          setMessage("Dépôt effectué avec succès !");
          refresh();
          setTimeout(() => setMessage(""), 3000);
        },
      }
    );
  };

  const handleWithdraw = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    withdrawMutation.mutate(
      { data: { amount: val, method: withdrawMethod } },
      {
        onSuccess: () => {
          setWithdrawOpen(false);
          setAmount("");
          setMessage("Retrait effectué avec succès !");
          refresh();
          setTimeout(() => setMessage(""), 3000);
        },
        onError: () => {
          setMessage("Solde insuffisant ou erreur lors du retrait.");
          setTimeout(() => setMessage(""), 3000);
        },
      }
    );
  };

  const txTypeLabels: Record<string, string> = {
    deposit: "Dépôt",
    withdrawal: "Retrait",
    trade_buy: "Achat",
    trade_sell: "Vente",
    fee: "Frais",
  };

  const txStatusStyles: Record<string, string> = {
    completed: "border-green-500/50 text-green-400",
    pending: "border-yellow-500/50 text-yellow-400",
    failed: "border-red-500/50 text-red-400",
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl font-bold">Portefeuille</h1>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium border ${
            message.includes("succès")
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border bg-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compte Réel</p>
                {balanceLoading ? (
                  <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold font-mono">${fmt(balance?.realBalance ?? 0)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{balance?.currency ?? "USD"}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1"
                onClick={() => { setAmount(""); setDepositOpen(true); }}
              >
                <ArrowDownCircle className="h-4 w-4" />
                Déposer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => { setAmount(""); setWithdrawOpen(true); }}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Retirer
              </Button>
            </div>
          </Card>

          <Card className="border-border bg-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compte Démo</p>
                {balanceLoading ? (
                  <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold font-mono">${fmt(balance?.demoBalance ?? 0)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Fonds virtuels</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Les fonds démo sont uniquement pour pratiquer. Ils ne peuvent pas être retirés.
            </p>
          </Card>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Historique des transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Montant</th>
                  <th className="text-right px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Description</th>
                  <th className="text-right px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {txLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="h-5 bg-secondary rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}
                {!txLoading && (!transactions || transactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      Aucune transaction pour le moment
                    </td>
                  </tr>
                )}
                {transactions?.map((tx) => {
                  const isCredit = tx.type === "deposit" || tx.type === "trade_sell";
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            isCredit ? "bg-green-500/10" : "bg-red-500/10"
                          }`}>
                            {isCredit
                              ? <ArrowDownCircle className="h-3.5 w-3.5 text-green-400" />
                              : <ArrowUpCircle className="h-3.5 w-3.5 text-red-400" />
                            }
                          </div>
                          <span className="font-medium">{txTypeLabels[tx.type] ?? tx.type}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${isCredit ? "text-green-400" : "text-red-400"}`}>
                        {isCredit ? "+" : "-"}${fmt(Math.abs(tx.amount))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className={txStatusStyles[tx.status] ?? ""}>
                          {tx.status === "completed" ? "Complété" : tx.status === "pending" ? "En cours" : "Échoué"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {tx.description ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                        {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déposer des fonds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Deposit address */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Bitcoin className="h-3.5 w-3.5 text-primary" />
                Adresse de dépôt crypto
              </div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs font-bold text-primary break-all flex-1">
                  TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS");
                  }}
                  className="shrink-0 p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                  title="Copier l'adresse"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Minimum : </span>
                  <span className="font-bold text-foreground">$10</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Frais : </span>
                  <span className="font-bold text-foreground">$1</span>
                </div>
              </div>
            </div>

            {/* Validation info */}
            <div className="flex gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Envoyez le montant exact à l'adresse ci-dessus, puis confirmez ci-dessous.
                Votre dépôt sera crédité après validation par notre équipe (sous 24h).
              </span>
            </div>

            <div>
              <Label htmlFor="deposit-amount" className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Montant envoyé (USD)
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Minimum $10"
                min="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-card border-border font-mono"
              />
              <div className="flex gap-2 mt-2">
                {[50, 100, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    ${v}
                  </button>
                ))}
              </div>
              {amount && parseFloat(amount) >= 10 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  Vous recevrez{" "}
                  <span className="text-green-400 font-bold">
                    ${(parseFloat(amount) - 1).toFixed(2)}
                  </span>{" "}
                  après déduction des frais ($1)
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={depositMutation.isPending || !amount || parseFloat(amount) < 10}
            >
              {depositMutation.isPending ? "Envoi en cours..." : "Confirmer le dépôt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer des fonds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Méthode</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["bank_transfer", "crypto"] as WithdrawMethod[]).map((m) => {
                  const icons = { bank_transfer: Building2, crypto: Bitcoin };
                  const labels = { bank_transfer: "Virement", crypto: "Crypto" };
                  const Icon = icons[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setWithdrawMethod(m)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                        withdrawMethod === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="withdraw-amount" className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Montant (USD) — Solde réel: ${fmt(balance?.realBalance ?? 0)}
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-card border-border font-mono"
              />
            </div>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending || !amount}
            >
              {withdrawMutation.isPending ? "Traitement..." : `Retirer $${amount || "0"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
