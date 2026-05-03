import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FeatureFlagsPanel } from "@/components/dev/FeatureFlagsPanel";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { useAppRuntime } from "@/providers/AppRuntimeProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION, BUILD_NUMBER, formatBuildDate } from "@/lib/version";
import type { AppEnvironment, FeatureKey } from "@vinotheque/core";

const ENV_LABELS: Record<AppEnvironment, { label: string; sub: string; color: string }> = {
  prod: {
    label: "PROD",
    sub: "Hetzner / Coolify",
    color: "bg-emerald-50 border-emerald-300 text-emerald-700",
  },
  dev: {
    label: "DEV",
    sub: "macOS-VM auf dem Mac",
    color: "bg-amber-50 border-amber-300 text-amber-700",
  },
};

const Settings = () => {
  const { settings, updateSettings, wines, loadSampleData, resetToEmpty } = useWineStore();
  const { toast } = useToast();
  const { environment, features, surface, isDevEnvironment, updateFeatureFlag } = useAppRuntime();
  const [cellarName, setCellarName] = useState(settings.cellarName);
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [savingFeatureKey, setSavingFeatureKey] = useState<FeatureKey | null>(null);

  const env = ENV_LABELS[environment];
  const enabledCount = features.filter((feature) => feature.enabled).length;
  const endToEndFeatures = features.filter((feature) => feature.isEndToEnd);
  const parkedFeatures = features.filter((feature) => !feature.isEndToEnd);

  const handleSave = () => {
    const trimmed = cellarName.trim();
    if (!trimmed) {
      toast({ title: "Fehler", description: "Der Weinkeller-Name darf nicht leer sein.", variant: "destructive" });
      return;
    }

    updateSettings({ cellarName: trimmed, anthropicApiKey: apiKey.trim() || undefined });
    toast({ title: "Gespeichert", description: "Einstellungen wurden aktualisiert." });
  };

  const handleFeatureToggle = async (featureKey: FeatureKey, enabled: boolean) => {
    setSavingFeatureKey(featureKey);

    try {
      await updateFeatureFlag(featureKey, enabled);
      toast({
        title: "Feature-Flag aktualisiert",
        description: enabled
          ? "Das Feature wurde zentral aktiviert und gilt fuer Web, PWA und iOS."
          : "Das Feature wurde zentral deaktiviert.",
      });
    } catch (error) {
      toast({
        title: "Aktualisierung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Die Feature-Flags konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setSavingFeatureKey(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-muted-foreground" />
          <h1 className="text-3xl font-display font-bold">Einstellungen</h1>
        </div>
        <p className="text-muted-foreground font-body mt-2">
          Laufzeit und persoenliche Einstellungen an einem Ort.
        </p>
      </div>

      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-6 animate-fade-in", env.color)}>
        <ShieldCheck className="w-4 h-4" />
        Umgebung: <span className="font-semibold">{env.label}</span>
        <span className="opacity-60">- {env.sub}</span>
      </div>

      <div className="glass-card p-6 max-w-2xl animate-fade-in mb-6" style={{ animationDelay: "40ms" }}>
        <h2 className="text-lg font-display font-semibold mb-2">Betriebsmodus</h2>
        <p className="text-xs text-muted-foreground font-body mb-4">
          DEV und PROD werden ueber Deployment und Backend-Konfiguration getrennt. Feature-Flags werden waehrend der Entwicklungsphase zentral in der Web-App geschaltet.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Runtime</p>
            <p className="mt-1 text-xl font-display font-semibold">{env.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{env.sub}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Surface</p>
            <p className="mt-1 text-xl font-display font-semibold">{surface.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground mt-1">Web und PWA teilen dieselbe Codebasis.</p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Features aktiv</p>
            <p className="mt-1 text-xl font-display font-semibold">{enabledCount} / {endToEndFeatures.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Nur end-to-end-faehige Features werden geschaltet.</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 max-w-2xl animate-fade-in mb-6" style={{ animationDelay: "80ms" }}>
        <h2 className="text-lg font-display font-semibold mb-2">Allgemein</h2>
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

      <div className="glass-card p-6 max-w-2xl animate-fade-in mb-6" style={{ animationDelay: "120ms" }}>
        <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-muted-foreground" />
          KI-Integration
        </h2>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Anthropic API-Key fuer PDF-Import und den optionalen Claude-Vision-Fallback. Der Key wird lokal gespeichert und nur direkt aus dem Browser an Anthropic gesendet.{" "}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline text-primary">
            Key erstellen
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
                placeholder="sk-ant-..."
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Nur einen persoenlichen Browser-Key hinterlegen. Hier niemals einen Server-Key verwenden.
            </p>
          </div>
          <Button variant="wine" onClick={handleSave}>Speichern</Button>
        </div>
      </div>

      {isDevEnvironment && (
        <FeatureFlagsPanel
          endToEndFeatures={endToEndFeatures}
          parkedFeatures={parkedFeatures}
          savingFeatureKey={savingFeatureKey}
          onToggle={handleFeatureToggle}
        />
      )}

      {isDevEnvironment && (
        <div className="glass-card p-6 max-w-2xl animate-fade-in mt-6" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-display font-semibold mb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-muted-foreground" />
            DEV-Werkzeuge
          </h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Nur in DEV sichtbar. Damit koennen wir Demos und Rollout-Schritte vorbereiten, ohne PROD zu beruehren.
            Aktuell: <span className="font-semibold text-foreground">{wines.length} Weine</span>
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="wine"
              onClick={() => {
                loadSampleData();
                toast({ title: "Demodaten geladen", description: "300 Beispielweine wurden in DEV geladen." });
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              300 Demoweine laden
            </Button>

            {!confirmReset ? (
              <Button variant="outline" onClick={() => setConfirmReset(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Alle DEV-Daten loeschen
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-sm text-destructive">Wirklich alle DEV-Daten loeschen?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    resetToEmpty();
                    setConfirmReset(false);
                    toast({ title: "DEV geleert", description: "Alle lokalen DEV-Daten wurden entfernt." });
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

      <div className="glass-card p-6 max-w-2xl animate-fade-in mt-6" style={{ animationDelay: "240ms" }}>
        <h2 className="text-lg font-display font-semibold mb-2">App-Version</h2>
        <p className="text-sm text-muted-foreground font-body">
          Installierte Version: <span className="font-mono text-foreground">v{APP_VERSION}</span>
          <span className="mx-2">-</span>
          Datum: <span className="font-mono text-foreground">{formatBuildDate()}</span>
          <span className="mx-2">-</span>
          Build-Nr.: <span className="font-mono text-foreground">{BUILD_NUMBER}</span>
        </p>
      </div>
    </AppLayout>
  );
};

export default Settings;
