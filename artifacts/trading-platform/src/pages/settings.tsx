import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { User, Shield, Activity, Save } from "lucide-react";

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { data: me } = useGetMe();
  const updateMe = useUpdateMe();

  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me?.displayName) setDisplayName(me.displayName);
  }, [me?.displayName]);

  const handleSaveProfile = () => {
    updateMe.mutate(
      { data: { displayName } },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  };

  const handleModeToggle = (mode: "real" | "demo") => {
    updateMe.mutate({ data: { tradingMode: mode } });
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>

        <Card className="border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Profil</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Email
              </Label>
              <Input
                id="email"
                value={clerkUser?.emailAddresses[0]?.emailAddress ?? ""}
                disabled
                className="bg-secondary/50 border-border text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">L'email ne peut pas être modifié ici.</p>
            </div>
            <div>
              <Label htmlFor="displayName" className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Nom d'affichage
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom ou pseudo"
                className="bg-card border-border"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={updateMe.isPending || !displayName}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saved ? "Sauvegardé !" : updateMe.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </Card>

        <Card className="border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Mode de trading</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Choisissez entre le mode Démo (fonds virtuels) et le mode Réel (argent réel).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleModeToggle("demo")}
              className={`p-4 rounded-lg border text-left transition-colors ${
                me?.tradingMode === "demo"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:bg-secondary"
              }`}
            >
              <p className={`font-bold text-sm ${me?.tradingMode === "demo" ? "text-primary" : "text-foreground"}`}>
                DEMO
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                $10,000 de fonds virtuels. Pratiquez sans risque.
              </p>
            </button>
            <button
              onClick={() => handleModeToggle("real")}
              className={`p-4 rounded-lg border text-left transition-colors ${
                me?.tradingMode === "real"
                  ? "border-green-500 bg-green-500/10"
                  : "border-border bg-secondary/30 hover:bg-secondary"
              }`}
            >
              <p className={`font-bold text-sm ${me?.tradingMode === "real" ? "text-green-400" : "text-foreground"}`}>
                LIVE
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tradez avec de l'argent réel. Dépôt requis.
              </p>
            </button>
          </div>
        </Card>

        <Card className="border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Informations du compte</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Membre depuis</span>
              <span className="font-medium">
                {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "–"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">ID du compte</span>
              <span className="font-mono text-xs text-muted-foreground">#{me?.id}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Mode actuel</span>
              <span className={`font-bold text-xs px-2 py-1 rounded ${
                me?.tradingMode === "demo"
                  ? "bg-primary/10 text-primary"
                  : "bg-green-500/10 text-green-400"
              }`}>
                {me?.tradingMode === "demo" ? "DEMO" : "LIVE"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
