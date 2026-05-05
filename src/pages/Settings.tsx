import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Database, Trash2, AlertTriangle, KeyRound, Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { APP_VERSION, formatBuildDate } from "@/lib/version";
import { FEATURE_FLAG_LABELS, type FeatureFlagKey } from "@/hooks/useWineStore";

const Settings = () => {
  const {
    settings,
    updateSettings,
    wines,
    loadTestData,
    resetToEmpty,
    activeEnv,
    isTestEnv,
    runtimeLocation,
    runtimeState,
    setLocalRuntimeEnv,
  } = useWineStore();
  const { toast } = useToast();
  const [cellarName, setCellarName] = useState(settings.cellarName);
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    const trimmed = cellarName.trim();
    if (!trimmed) {
      toast({ title: "Fehler", description: "Der Weinkeller-Name darf nicht leer sein.", variant: "destructive" });
      return;
    }
    updateSettings({ cellarName: trimmed, anthropicApiKey: apiKey.trim() || undefined });
    toast({ title: "Gespeichert", description: "Einstellungen wurden aktualisiert." });
  };

  const updateFeatureFlag = (feature: FeatureFlagKey, enabled: boolean) => {
    updateSettings({
      featureFlags: {
        ...settings.featureFlags,
        [feature]: enabled,
      },
    });
  };

  const featureFlagEntries = Object.entries(FEATURE_FLAG_LABELS) as Array<[FeatureFlagKey, typeof FEATURE_FLAG_LABELS[FeatureFlagKey]]>;

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

      {runtimeLocation === "local" && (
        <div className="glass-card p-6 max-w-lg animate-fade-in mb-6" style={{ animationDelay: "25ms" }}>
          <h2 className="text-lg font-display font-semibold mb-2">Lokale Instanz</h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Aktueller Zustand: <span className="font-semibold text-foreground">{runtimeState}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeEnv === "test" ? "wine" : "outline"}
              onClick={() => setLocalRuntimeEnv("test")}
            >
              TEST-Local
            </Button>
            <Button
              variant={activeEnv === "prod" ? "wine" : "outline"}
              onClick={() => setLocalRuntimeEnv("prod")}
            >
              PROD-Local
            </Button>
          </div>
        </div>
      )}

      {/* ── Allgemein ─────────────────────────────────────────────── */}
      <div className="glass-card p-6 max-w-lg animate-fade-in" style={{ animationDelay: "50ms" }}>
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

      {/* ── Feature Flags ─────────────────────────────────────────── */}
      <div className="glass-card p-6 max-w-2xl animate-fade-in mt-6" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          Feature Flags
        </h2>
        <div className="mt-4 divide-y divide-border">
          {featureFlagEntries.map(([key, info]) => {
            const enabled = settings.featureFlags[key];
            return (
              <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Label htmlFor={`feature-${key}`} className="font-body text-sm font-semibold">
                    {info.label}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground font-body">
                    {info.description}
                  </p>
                </div>
                <Switch
                  id={`feature-${key}`}
                  checked={enabled}
                  onCheckedChange={(checked) => updateFeatureFlag(key, checked)}
                  aria-label={`${info.label} ${enabled ? "deaktivieren" : "aktivieren"}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KI-Integration ────────────────────────────────────────── */}
      <div className="glass-card p-6 max-w-lg animate-fade-in mt-6" style={{ animationDelay: "150ms" }}>
        <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-muted-foreground" />
          KI-Integration
        </h2>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Anthropic API-Key für den PDF-Rechnungsimport. Der Key wird lokal gespeichert und nicht übertragen.{" "}
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
          Build: <span className="font-mono text-foreground">{formatBuildDate()}</span>
        </p>
        <div className={`mt-3 inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal text-white ${runtimeState.startsWith("TEST") ? "bg-blue-600" : "bg-emerald-700"}`}>
          {runtimeState}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
