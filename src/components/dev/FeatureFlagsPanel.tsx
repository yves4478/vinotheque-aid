import { CheckCircle2, PauseCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { FeatureKey, RuntimeFeatureState } from "@vinotheque/core";

interface FeatureFlagsPanelProps {
  features: RuntimeFeatureState[];
  savingFeatureKey: FeatureKey | null;
  onToggle: (featureKey: FeatureKey, enabled: boolean) => void | Promise<void>;
}

// Temporary development-only feature flag UI.
// Remove this component and its single usage in Settings once rollout is complete.
export function FeatureFlagsPanel({
  features,
  savingFeatureKey,
  onToggle,
}: FeatureFlagsPanelProps) {
  return (
    <div className="glass-card p-6 max-w-2xl animate-fade-in mt-6" style={{ animationDelay: "160ms" }}>
      <h2 className="text-lg font-display font-semibold mb-2">Feature Flags</h2>
      <p className="text-xs text-muted-foreground font-body mb-4">
        Die Schalter schreiben zentral ins Backend und gelten danach für Web und PWA.
      </p>
      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature.key} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/70 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-foreground">{feature.label}</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    feature.enabled
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-amber-300 bg-amber-50 text-amber-700",
                  )}
                >
                  {feature.enabled ? <CheckCircle2 className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                  {feature.enabled ? "aktiv" : "aus"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{feature.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {savingFeatureKey === feature.key && (
                <span className="text-xs text-muted-foreground">speichert...</span>
              )}
              <Switch
                checked={feature.enabled}
                disabled={savingFeatureKey === feature.key}
                onCheckedChange={(checked) => void onToggle(feature.key, checked)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
