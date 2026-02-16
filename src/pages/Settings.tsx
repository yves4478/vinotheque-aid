import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Database, Trash2, AlertTriangle } from "lucide-react";

const Settings = () => {
  const { settings, updateSettings, wines, loadTestData, resetToEmpty } = useWineStore();
  const { toast } = useToast();
  const [cellarName, setCellarName] = useState(settings.cellarName);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    const trimmed = cellarName.trim();
    if (!trimmed) {
      toast({ title: "Fehler", description: "Der Weinkeller-Name darf nicht leer sein.", variant: "destructive" });
      return;
    }
    updateSettings({ cellarName: trimmed });
    toast({ title: "Gespeichert", description: "Einstellungen wurden aktualisiert." });
  };

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
              Dieser Name wird in der Sidebar, im Dashboard und im Seitentitel angezeigt.
            </p>
          </div>
          <Button variant="wine" onClick={handleSave}>Speichern</Button>
        </div>
      </div>

      {/* Testdaten */}
      <div className="glass-card p-6 max-w-lg animate-fade-in mt-6" style={{ animationDelay: "200ms" }}>
        <h2 className="text-lg font-display font-semibold mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          Testdaten
        </h2>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Lade 300 realistische Testdaten in deinen Weinkeller oder setze ihn zurück.
          Aktuell: <span className="font-semibold text-foreground">{wines.length} Weine</span>
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="wine"
            onClick={() => {
              loadTestData();
              toast({ title: "Testdaten geladen", description: "300 Weine wurden in den Keller geladen." });
            }}
          >
            <Database className="w-4 h-4 mr-2" />
            300 Testdaten laden
          </Button>

          {!confirmReset ? (
            <Button
              variant="outline"
              onClick={() => setConfirmReset(true)}
            >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(false)}
              >
                Nein
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
