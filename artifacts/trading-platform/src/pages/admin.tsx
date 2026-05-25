import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetMe,
  useAdminGetTransactions,
  useAdminApproveTransaction,
  useAdminRejectTransaction,
  useAdminGetUsers,
  useAdminToggleAdmin,
  getAdminGetTransactionsQueryKey,
  getAdminGetUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Shield,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Redirect } from "wouter";

const DEPOSIT_ADDRESS = "TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS";
const MIN_DEPOSIT = 10;
const DEPOSIT_FEE = 1;

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusStyle(status: string) {
  if (status === "completed") return "border-green-500/50 text-green-400 bg-green-500/10";
  if (status === "pending") return "border-yellow-500/50 text-yellow-400 bg-yellow-500/10";
  return "border-red-500/50 text-red-400 bg-red-500/10";
}

function statusLabel(status: string) {
  if (status === "completed") return "Approuvé";
  if (status === "pending") return "En attente";
  return "Rejeté";
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { data: me, isLoading: meLoading } = useGetMe();
  const { data: transactions, isLoading: txLoading } = useAdminGetTransactions();
  const { data: users, isLoading: usersLoading } = useAdminGetUsers();

  const approveMutation = useAdminApproveTransaction();
  const rejectMutation = useAdminRejectTransaction();
  const toggleAdminMutation = useAdminToggleAdmin();

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; txId: number | null }>({
    open: false,
    txId: null,
  });
  const [rejectNote, setRejectNote] = useState("");
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getAdminGetTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
  };

  if (meLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!me?.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  const pendingTxs = (transactions ?? []).filter((t) => t.status === "pending");
  const allTxs = transactions ?? [];

  const handleApprove = (id: number) => {
    approveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          showFeedback("Transaction approuvée — le solde a été crédité.", true);
          refresh();
        },
        onError: () => showFeedback("Erreur lors de l'approbation.", false),
      }
    );
  };

  const handleOpenReject = (id: number) => {
    setRejectNote("");
    setRejectDialog({ open: true, txId: id });
  };

  const handleConfirmReject = () => {
    if (!rejectDialog.txId) return;
    rejectMutation.mutate(
      { id: rejectDialog.txId, data: { note: rejectNote || "Rejeté par l'administrateur" } },
      {
        onSuccess: () => {
          setRejectDialog({ open: false, txId: null });
          showFeedback("Transaction rejetée.", true);
          refresh();
        },
        onError: () => showFeedback("Erreur lors du rejet.", false),
      }
    );
  };

  const handleToggleAdmin = (id: number) => {
    toggleAdminMutation.mutate(
      { id },
      {
        onSuccess: () => {
          showFeedback("Statut admin mis à jour.", true);
          refresh();
        },
        onError: () => showFeedback("Erreur lors de la mise à jour.", false),
      }
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Espace Admin</h1>
            <p className="text-sm text-muted-foreground">
              Validation des transactions — connecté en tant que {me.email}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {pendingTxs.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {pendingTxs.length} en attente
              </Badge>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-sm font-medium border ${
              feedback.ok
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Deposit info card */}
        <Card className="border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Adresse de dépôt (crypto)
              </p>
              <p className="font-mono text-sm font-bold text-primary break-all">{DEPOSIT_ADDRESS}</p>
            </div>
            <div className="flex gap-6 text-center shrink-0">
              <div>
                <p className="text-xs text-muted-foreground">Dépôt minimum</p>
                <p className="font-bold text-foreground">${MIN_DEPOSIT}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frais de traitement</p>
                <p className="font-bold text-foreground">${DEPOSIT_FEE}</p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="pending">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary/20">
              En attente ({pendingTxs.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
              Toutes les transactions ({allTxs.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
              Utilisateurs ({users?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* PENDING TRANSACTIONS */}
          <TabsContent value="pending" className="mt-4">
            <Card className="border-border bg-card overflow-hidden">
              {txLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : pendingTxs.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500/50" />
                  <p className="font-medium">Aucune transaction en attente</p>
                  <p className="text-sm mt-1">Toutes les demandes ont été traitées.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Utilisateur</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-right px-4 py-3">Montant</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Description</th>
                        <th className="text-right px-4 py-3">Date</th>
                        <th className="text-center px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTxs.map((tx) => (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-xs truncate max-w-[160px]">
                                {tx.userDisplayName || tx.userEmail}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                {tx.userEmail}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {tx.type === "deposit" ? (
                                <ArrowDownCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className="capitalize">
                                {tx.type === "deposit" ? "Dépôt" : "Retrait"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            <span className={tx.type === "deposit" ? "text-green-400" : "text-red-400"}>
                              {tx.type === "deposit" ? "+" : "-"}${fmt(tx.amount)}
                            </span>
                            {tx.type === "deposit" && (
                              <p className="text-[10px] text-muted-foreground">
                                Net: ${fmt(tx.amount - DEPOSIT_FEE)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell max-w-[200px]">
                            <p className="truncate">{tx.description ?? "–"}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30"
                                onClick={() => handleApprove(tx.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleOpenReject(tx.id)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ALL TRANSACTIONS */}
          <TabsContent value="all" className="mt-4">
            <Card className="border-border bg-card overflow-hidden">
              {txLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : allTxs.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune transaction</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Utilisateur</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-right px-4 py-3">Montant</th>
                        <th className="text-center px-4 py-3">Statut</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Note admin</th>
                        <th className="text-right px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTxs.map((tx) => (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs truncate max-w-[140px]">{tx.userEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {tx.type === "deposit" ? (
                                <ArrowDownCircle className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <ArrowUpCircle className="h-3.5 w-3.5 text-red-400" />
                              )}
                              {tx.type === "deposit" ? "Dépôt" : "Retrait"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className={tx.type === "deposit" ? "text-green-400" : "text-red-400"}>
                              {tx.type === "deposit" ? "+" : "-"}${fmt(tx.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={statusStyle(tx.status)}>
                              {statusLabel(tx.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {tx.adminNote ?? "–"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="mt-4">
            <Card className="border-border bg-card overflow-hidden">
              {usersLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Nom</th>
                        <th className="text-right px-4 py-3">Solde réel</th>
                        <th className="text-right px-4 py-3 hidden md:table-cell">Solde démo</th>
                        <th className="text-center px-4 py-3">Mode</th>
                        <th className="text-center px-4 py-3">Admin</th>
                        <th className="text-center px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(users ?? []).map((u) => (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs truncate max-w-[160px]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                            {u.displayName ?? "–"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-green-400 font-medium">
                            ${fmt(u.realBalance)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden md:table-cell">
                            ${fmt(u.demoBalance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={
                                u.tradingMode === "real"
                                  ? "border-green-500/40 text-green-400"
                                  : "border-primary/40 text-primary"
                              }
                            >
                              {u.tradingMode === "real" ? "LIVE" : "DEMO"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.isAdmin ? (
                              <Badge className="bg-primary/20 text-primary border-primary/40">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.id !== me.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => handleToggleAdmin(u.id)}
                                disabled={toggleAdminMutation.isPending}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                {u.isAdmin ? "Retirer admin" : "Rendre admin"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ open: o, txId: o ? rejectDialog.txId : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Ajoutez une note de rejet (optionnel). Le montant sera remboursé si c'est un retrait.
            </p>
            <Input
              placeholder="Raison du rejet..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="bg-card border-border"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, txId: null })}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
