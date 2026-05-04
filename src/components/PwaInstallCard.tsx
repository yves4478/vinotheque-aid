import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "vinotheque-pwa-install-dismissed";

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(iosNavigator.standalone);
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);
  return isIos && isSafari;
}

export function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const storedDismissal = localStorage.getItem(DISMISS_KEY);
    setDismissed(storedDismissal === "true");
    setShowIosHint(isIosSafari());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(storedDismissal === "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (dismissed || isStandalone() || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="apple-card mb-6 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          {deferredPrompt ? <Download className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Vinotheque als App installieren</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {deferredPrompt
              ? "Installiere Vinotheque fuer Homescreen-Start, schnelleren Zugriff und eine app-aehnliche Nutzung."
              : "Auf dem iPhone: in Safari ueber Teilen und dann Zum Home-Bildschirm hinzufuegen."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {deferredPrompt ? (
          <button
            type="button"
            onClick={install}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Installieren
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center justify-center rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
          aria-label="Installationshinweis ausblenden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
