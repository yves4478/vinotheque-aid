import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { settings, updateSettings } = useWineStore();
  const { toast } = useToast();
  const [cellarName, setCellarName] = useState(settings.cellarName);

  const handleSave = () => {
    const trimmed = cellarName.trim();
    if (!trimmed) {
      toast({ title: "Fehler", description: "Der Name darf nicht leer sein.", variant: "destructive" });
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
          Passe deine Einstellungen nach deinen Wünschen an.
        </p>
      </div>

      <div className="glass-card p-6 max-w-lg animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-display font-semibold mb-4">Allgemein</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cellarName" className="font-body">Name</Label>
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
    </AppLayout>
  );
};

export default Settings;
