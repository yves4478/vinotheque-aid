import { AppLayout } from "@/components/AppLayout";
import { Camera, Upload, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";

const AddWine = () => {
  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Wein hinzufügen</h1>
        <p className="text-muted-foreground font-body mt-1">
          Fotografiere ein Etikett oder erfasse manuell
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Photo capture */}
        <div className="glass-card p-8 text-center animate-fade-in group hover:border-primary/30 transition-all cursor-pointer" style={{ animationDelay: "100ms" }}>
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Etikett fotografieren</h2>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Fotografiere das Weinetikett und wir erkennen automatisch alle Informationen
          </p>
          <Button variant="wine" size="lg" className="w-full">
            <Camera className="w-4 h-4" />
            Foto aufnehmen
          </Button>
        </div>

        {/* Upload */}
        <div className="glass-card p-8 text-center animate-fade-in group hover:border-primary/30 transition-all cursor-pointer" style={{ animationDelay: "200ms" }}>
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
            <Upload className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Bild hochladen</h2>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Lade ein bestehendes Foto vom Etikett hoch, um den Wein zu identifizieren
          </p>
          <Button variant="gold" size="lg" className="w-full">
            <Upload className="w-4 h-4" />
            Bild auswählen
          </Button>
        </div>
      </div>

      {/* Info note */}
      <div className="glass-card p-5 mt-6 max-w-4xl animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex gap-3">
          <Wine className="w-5 h-5 text-wine-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-medium text-foreground">KI-gestützte Erkennung</p>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Unsere KI erkennt Weinnamen, Jahrgang, Produzent, Region und schlägt automatisch
              Trinkreife, Ratings und Kaufpreise vor. Du musst nichts manuell eingeben.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AddWine;
