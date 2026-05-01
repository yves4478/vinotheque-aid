import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Database, Trash2, AlertTriangle, FlaskConical, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION, BUILD_NUMBER, formatBuildDate } from "@/lib/version";
import type { AppEnv } from "@/hooks/useWineStore";

const ENV_LABELS: Record<AppEnv, { label: string; sub: string; icon: React.ReactNode; color: string }> = {
  prod: {
    label: "Produktiv",
    sub: "Deine echten Weine",
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "bg-emerald-50 border-emerald-300 text-emerald-700",
  },
  test: {
    label: "Test",
    sub: "Testdaten, ausprobieren",
    icon: <FlaskConical className="w-4 h-4" />,
    color: "bg-amber-50 border-amber-300 text-amber-700",
  },
};

const Settings = () => {
  const { settings, updateSettings, wines, loadTestData, resetToEmpty, activeEnv, isTestEnv, switchEnv } = useWineStore();
  const { toast } = useToast();
  const [cellarName, setCellarName] = useState(settings.cellarName);
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingEnv, setPendingEnv] = useState<AppEnv | null>(null);

  const handleSave = () => {
    const trimmed = cellarName.trim();
    if (!trimmed) {
      toast({ title: "Fehler", description: "Der Weinkeller-Name darf nicht leer sein.", variant: "destructive" });
      return;
    }
    updateSettings({ cellarName: trimmed, anthropicApiKey: apiKey.trim() || undefined });
    toast({ title: "Gespeichert", description: "Einstellungen wurden aktualisiert." });
  };

  const handleEnvSwitch = (env: AppEnv) => {
    if (env === activeEnv) return;
    setPendingEnv(env);
  };

  const confirmEnvSwitch = () => {
    if (!pendingEnv) return;
    switchEnv(pendingEnv);
  };

  const env = ENV_LABELS[activeEnv];

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-muted-foreground" />
          <h1 className="text-3xl font-display font-bold">Einstellungen</h1>
        </div>
        <p className="text-muted-foreground font-body mt-2">
          Passe deinen Weinkeller nach deinen Wünschen an.
        </p>
      </div>

      {/* ── Aktive Umgebung Badge ─────────────────────────────────── */}
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-6 animate-fade-in", env.color)}>
        {env.icon}
        Umgebung: <span className="font-semibold">{env.label}</span>
        <span className="opacity-60">— {env.sub}</span>
      </div>

      {/* ── Umgebung wechseln ─────────────────────────────────────── */}
      <div className="glass-card p-6 max-w-lg animate-fade-in mb-6" style={{ animationDelay: "50ms" }}>
        <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-muted-foreground" />
          Umgebung
        </h2>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Produktiv und Test haben komplett getrennte Datenbanken. Der Wechsel lädt die Seite neu.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["prod", "test"] as AppEnv[]).map((e) => {
            const info = ENV_LABELS[e];
            const isActive = e === activeEnv;
            return (
              <button
                key={e}
                onClick={() => handleEnvSwitch(e)}
                disabled={isActive}
                className={cn(
                  "flex flex-col items-start gap-1 px-4 py-3 rounded-xl border-2 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 cursor-default"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <span className={cn("flex items-center gap-1.5 font-semibold text-sm", isActive && "text-primary")}>
                  {info.icon}
                  {info.label}
                  {isActive && <span className="ml-1 text-[10px] font-medium bg-primary text-white rounded-full px-1.5 py-0.5">aktiv</span>}
                </span>
                <span className="text-xs text-muted-foreground">{info.sub}</span>
              </button>
            );
          })}
        </div>

        {/* Bestätigungs-Dialog */}
        {pendingEnv && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg border border-amber-300 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                Zu «{ENV_LABELS[pendingEnv].label}» wechseln?
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Die Seite wird neu geladen. Deine {ENV_LABELS[activeEnv].label}-Daten bleiben gespeichert.
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={confirmEnvSwitch}>
                  Wechseln
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingEnv(null)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Allgemein ─────────────────────────────────────────────── */}
      <div className="glass-card p-6 max-w-lg animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-display font-semibold mb-4">Allgemein</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cellarName" className="font-body">Weinkeller-Name</Label>
            <Input
              id="cellarName"
              value={cellarName}
              onChange={(e) => setCellarName(e.target.value)}
              placeholder="z.B. Yves Weinkeller"
              className="font-body"
            />
            <p className="text-xs text-muted-foreground font-body">
              Wird in der Sidebar, im Dashboard und im Seitentitel angezeigt.
            </p>
          </div>
          <Button variant="wine" onClick={handleSave}>Speichern</Button>
        </div>
      </div>

      {/* ── KI-Integration ────────────────────────────────────────── */}
      <div className="glass-card p-6 max-w-lg animate-fade-in mt-6" style={{ animationDelay: "150ms" }}>
        <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-muted-foreground" />
          KI-Integration
        </h2>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Anthropic API-Key für PDF-Import und den optionalen Claude-Vision-Fallback. Der Key wird lokal gespeichert und nur direkt aus dem Browser an Anthropic gesendet.{" "}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline text-primary">
            Key erstellen →
          </a>
        </p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="font-body">Anthropic API-Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-…"
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Nur einen persönlichen Browser-Key hinterlegen. Der Key ist im Client verfügbar und kann in DevTools sichtbar sein, daher hier niemals einen Server-Key verwenden.
            </p>
          </div>
          <Button variant="wine" onClick={handleSave}>Speichern</Button>
        </div>
      </div>

      {/* ── Testdaten (nur im Test-Modus) ─────────────────────────── */}
      {isTestEnv && (
        <div className="glass-card p-6 max-w-lg animate-fade-in mt-6" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-display font-semibold mb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-muted-foreground" />
            Testdaten
          </h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Lade 300 realistische Testdaten oder setze den Testkeller zurück.
            Aktuell: <span className="font-semibold text-foreground">{wines.length} Weine</span>
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="wine"
              onClick={() => {
                loadTestData();
                toast({ title: "Testdaten geladen", description: "300 Weine wurden in den Testkeller geladen." });
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              300 Testdaten laden
            </Button>

            {!confirmReset ? (
              <Button variant="outline" onClick={() => setConfirmReset(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Alle Weine löschen
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-sm text-destructive">Wirklich alle löschen?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    resetToEmpty();
                    setConfirmReset(false);
                    toast({ title: "Gelöscht", description: "Alle Weine wurden entfernt." });
                  }}
                >
                  Ja
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
                  Nein
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass-card p-6 max-w-lg animate-fade-in mt-6" style={{ animationDelay: "250ms" }}>
        <h2 className="text-lg font-display font-semibold mb-2">App-Version</h2>
        <p className="text-sm text-muted-foreground font-body">
          Installierte Version: <span className="font-mono text-foreground">v{APP_VERSION}</span>
          <span className="mx-2">·</span>
          Datum: <span className="font-mono text-foreground">{formatBuildDate()}</span>
          <span className="mx-2">·</span>
          Build-Nr.: <span className="font-mono text-foreground">{BUILD_NUMBER}</span>
        </p>
      </div>
    </AppLayout>
  );
};

export default Settings;
