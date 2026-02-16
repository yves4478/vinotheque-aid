import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useFeedbackStore } from "@/hooks/useFeedbackStore";
import { Bug, Lightbulb, MessageSquarePlus, Send, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const PAGE_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/cellar": "Weinkeller",
  "/add": "Wein hinzufügen",
  "/suggestions": "Vorschläge",
  "/shopping": "Einkaufsliste",
  "/merchants": "Weinhändler",
  "/ratings": "Bewertungen",
  "/wishlist": "Wunschliste",
  "/map": "Weinregionen",
  "/settings": "Einstellungen",
};

export function FeedbackWidget() {
  const location = useLocation();
  const { addFeedback, feedback, downloadFeedbackJSON } = useFeedbackStore();
  const [open, setOpen] = useState(false);
  const [bugText, setBugText] = useState("");
  const [suggestionText, setSuggestionText] = useState("");

  const currentPage = PAGE_NAMES[location.pathname] || location.pathname;
  const openCount = feedback.filter((f) => f.status === "open").length;

  const handleSubmitBug = () => {
    if (!bugText.trim()) return;
    addFeedback("bug", currentPage, bugText.trim());
    setBugText("");
    toast.success("Bug-Meldung gespeichert", {
      description: `Für Seite: ${currentPage}`,
    });
  };

  const handleSubmitSuggestion = () => {
    if (!suggestionText.trim()) return;
    addFeedback("suggestion", currentPage, suggestionText.trim());
    setSuggestionText("");
    toast.success("Verbesserungsvorschlag gespeichert", {
      description: `Für Seite: ${currentPage}`,
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-wine-burgundy text-primary-foreground shadow-lg hover:bg-wine-burgundy-light transition-all duration-300 wine-glow group"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Feedback</span>
        {openCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-wine-gold text-[10px] font-bold flex items-center justify-center text-accent-foreground">
            {openCount}
          </span>
        )}
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-wine-gold" />
              Feedback — {currentPage}
            </DialogTitle>
            <DialogDescription>
              Melde Fehler oder schlage Verbesserungen vor. Dein Feedback wird gespeichert und kann als JSON exportiert werden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Bug report */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-destructive">
                <Bug className="w-4 h-4" />
                Bug melden
              </label>
              <Textarea
                placeholder="Beschreibe den Fehler, den du gefunden hast..."
                value={bugText}
                onChange={(e) => setBugText(e.target.value)}
                className="min-h-[80px] border-destructive/30 focus-visible:ring-destructive/50"
              />
              <Button
                onClick={handleSubmitBug}
                disabled={!bugText.trim()}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Send className="w-3 h-3 mr-1" />
                Bug-Meldung senden
              </Button>
            </div>

            {/* Suggestion */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-wine-gold">
                <Lightbulb className="w-4 h-4" />
                Verbesserungsvorschlag
              </label>
              <Textarea
                placeholder="Beschreibe deine Idee für eine Funktionserweiterung..."
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                className="min-h-[80px] border-wine-gold/30 focus-visible:ring-wine-gold/50"
              />
              <Button
                onClick={handleSubmitSuggestion}
                disabled={!suggestionText.trim()}
                variant="gold"
                size="sm"
                className="w-full"
              >
                <Send className="w-3 h-3 mr-1" />
                Vorschlag senden
              </Button>
            </div>

            {/* Export + Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {feedback.length} Einträge gesamt ({openCount} offen)
              </p>
              <Button
                onClick={downloadFeedbackJSON}
                variant="outline"
                size="sm"
                disabled={feedback.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                JSON exportieren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
