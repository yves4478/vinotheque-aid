import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Store, Plus, Trash2, Edit2, Tag, ExternalLink,
  ChevronDown, ChevronUp, AlertTriangle, Percent, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";
import { MerchantDeal } from "@/data/wines";

interface DealMatch {
  deal: MerchantDeal;
  merchantName: string;
  merchantId: string;
  shoppingItemName: string;
  shoppingItemProducer: string;
}

const Merchants = () => {
  const {
    merchants, addMerchant, updateMerchant, removeMerchant,
    addDeal, removeDeal, shoppingItems,
  } = useWineStore();

  const [showAddMerchant, setShowAddMerchant] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<string | null>(null);
  const [showAddDeal, setShowAddDeal] = useState<string | null>(null);
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
  const [merchantForm, setMerchantForm] = useState({ name: "", website: "", location: "", notes: "" });
  const [dealForm, setDealForm] = useState({
    wineName: "", producer: "", originalPrice: 0, dealPrice: 0,
    discountPercent: 0, validFrom: "", validUntil: "", notes: "",
  });

  // Find matches between active deals and shopping list
  const dealMatches = useMemo((): DealMatch[] => {
    const uncheckedItems = shoppingItems.filter((i) => !i.checked);
    const matches: DealMatch[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (const merchant of merchants) {
      for (const deal of merchant.deals) {
        // Check if deal is currently active
        if (deal.validUntil < today) continue;

        for (const item of uncheckedItems) {
          const dealNameLower = deal.wineName.toLowerCase();
          const dealProducerLower = deal.producer.toLowerCase();
          const itemNameLower = item.name.toLowerCase();
          const itemProducerLower = item.producer.toLowerCase();

          const nameMatch = dealNameLower.includes(itemNameLower)
            || itemNameLower.includes(dealNameLower);
          const producerMatch = dealProducerLower.includes(itemProducerLower)
            || itemProducerLower.includes(dealProducerLower);

          if (nameMatch || (producerMatch && itemProducerLower.length > 0)) {
            matches.push({
              deal,
              merchantName: merchant.name,
              merchantId: merchant.id,
              shoppingItemName: item.name,
              shoppingItemProducer: item.producer,
            });
          }
        }
      }
    }
    return matches;
  }, [merchants, shoppingItems]);

  // Count active deals across all merchants
  const activeDealsCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return merchants.reduce((sum, m) =>
      sum + m.deals.filter((d) => d.validUntil >= today).length, 0);
  }, [merchants]);

  const handleAddMerchant = () => {
    if (!merchantForm.name.trim()) return;
    addMerchant({
      name: merchantForm.name.trim(),
      website: merchantForm.website.trim() || undefined,
      location: merchantForm.location.trim() || undefined,
      notes: merchantForm.notes.trim() || undefined,
    });
    setMerchantForm({ name: "", website: "", location: "", notes: "" });
    setShowAddMerchant(false);
  };

  const handleEditMerchant = () => {
    if (!editingMerchant || !merchantForm.name.trim()) return;
    updateMerchant(editingMerchant, {
      name: merchantForm.name.trim(),
      website: merchantForm.website.trim() || undefined,
      location: merchantForm.location.trim() || undefined,
      notes: merchantForm.notes.trim() || undefined,
    });
    setMerchantForm({ name: "", website: "", location: "", notes: "" });
    setEditingMerchant(null);
  };

  const openEditMerchant = (id: string) => {
    const m = merchants.find((m) => m.id === id);
    if (!m) return;
    setMerchantForm({
      name: m.name,
      website: m.website || "",
      location: m.location || "",
      notes: m.notes || "",
    });
    setEditingMerchant(id);
  };

  const handleAddDeal = () => {
    if (!showAddDeal || !dealForm.wineName.trim()) return;
    addDeal(showAddDeal, {
      wineName: dealForm.wineName.trim(),
      producer: dealForm.producer.trim(),
      originalPrice: dealForm.originalPrice,
      dealPrice: dealForm.dealPrice,
      discountPercent: dealForm.discountPercent,
      validFrom: dealForm.validFrom,
      validUntil: dealForm.validUntil,
      notes: dealForm.notes.trim() || undefined,
    });
    setDealForm({
      wineName: "", producer: "", originalPrice: 0, dealPrice: 0,
      discountPercent: 0, validFrom: "", validUntil: "", notes: "",
    });
    setShowAddDeal(null);
  };

  const updateDealPrices = (field: "originalPrice" | "dealPrice", value: number) => {
    const updated = { ...dealForm, [field]: value };
    if (updated.originalPrice > 0 && updated.dealPrice > 0) {
      updated.discountPercent = Math.round(
        ((updated.originalPrice - updated.dealPrice) / updated.originalPrice) * 100
      );
    }
    setDealForm(updated);
  };

  const isDealActive = (deal: MerchantDeal) => {
    const today = new Date().toISOString().split("T")[0];
    return deal.validUntil >= today;
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Weinhändler</h1>
          <p className="text-muted-foreground font-body mt-1">
            {merchants.length} Händler · {activeDealsCount} aktive Aktionen
          </p>
        </div>
        <Button variant="wine" onClick={() => {
          setMerchantForm({ name: "", website: "", location: "", notes: "" });
          setShowAddMerchant(true);
        }}>
          <Plus className="w-4 h-4" />
          Händler hinzufügen
        </Button>
      </div>

      {/* Deal Match Notifications */}
      {dealMatches.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <div className="glass-card border-wine-gold/40 bg-wine-gold/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-wine-gold" />
              <h2 className="font-display font-semibold text-wine-gold">
                Aktionen für deine Einkaufsliste!
              </h2>
            </div>
            <div className="space-y-2">
              {dealMatches.map((match, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-wine-gold/10">
                  <Tag className="w-4 h-4 text-wine-gold flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body">
                      <span className="font-semibold">{match.deal.wineName}</span>
                      {match.deal.producer && <span className="text-muted-foreground"> von {match.deal.producer}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      bei <span className="font-medium text-foreground">{match.merchantName}</span>
                      {" · "}
                      <span className="line-through">CHF {match.deal.originalPrice}</span>
                      {" → "}
                      <span className="text-wine-gold font-semibold">CHF {match.deal.dealPrice}</span>
                      {" "}
                      <span className="text-wine-gold">(-{match.deal.discountPercent}%)</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      Passend zu: «{match.shoppingItemName}» auf deiner Einkaufsliste
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Merchant List */}
      {merchants.length > 0 ? (
        <div className="space-y-4">
          {merchants.map((merchant, i) => {
            const isExpanded = expandedMerchant === merchant.id;
            const activeDealCount = merchant.deals.filter(isDealActive).length;

            return (
              <div
                key={merchant.id}
                className="glass-card animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Merchant Header */}
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => setExpandedMerchant(isExpanded ? null : merchant.id)}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold">{merchant.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        {merchant.location && <span>{merchant.location}</span>}
                        {merchant.location && activeDealCount > 0 && <span>·</span>}
                        {activeDealCount > 0 && (
                          <span className="text-wine-gold font-medium">
                            {activeDealCount} aktive Aktion{activeDealCount !== 1 ? "en" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {merchant.website && (
                      <a
                        href={merchant.website.startsWith("http") ? merchant.website : `https://${merchant.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditMerchant(merchant.id)}
                      className="p-2 text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeMerchant(merchant.id)}
                      className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: Deals */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {merchant.notes && (
                      <p className="text-xs text-muted-foreground font-body mb-3 italic">{merchant.notes}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-display font-semibold">Aktionen</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDealForm({
                            wineName: "", producer: "", originalPrice: 0, dealPrice: 0,
                            discountPercent: 0, validFrom: new Date().toISOString().split("T")[0],
                            validUntil: "", notes: "",
                          });
                          setShowAddDeal(merchant.id);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Aktion erfassen
                      </Button>
                    </div>

                    {merchant.deals.length > 0 ? (
                      <div className="space-y-2">
                        {merchant.deals.map((deal) => {
                          const active = isDealActive(deal);
                          const hasMatch = dealMatches.some(
                            (m) => m.deal.id === deal.id && m.merchantId === merchant.id
                          );

                          return (
                            <div
                              key={deal.id}
                              className={cn(
                                "p-3 rounded-lg border flex items-center gap-3",
                                !active && "opacity-40",
                                hasMatch
                                  ? "border-wine-gold/40 bg-wine-gold/5"
                                  : "border-border bg-card/50"
                              )}
                            >
                              <Percent className={cn(
                                "w-4 h-4 flex-shrink-0",
                                hasMatch ? "text-wine-gold" : "text-primary"
                              )} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-display font-semibold">{deal.wineName}</p>
                                  {hasMatch && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-wine-gold/20 text-wine-gold font-body font-medium">
                                      EINKAUFSLISTE
                                    </span>
                                  )}
                                  {!active && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-body font-medium">
                                      ABGELAUFEN
                                    </span>
                                  )}
                                </div>
                                {deal.producer && (
                                  <p className="text-xs text-muted-foreground font-body">{deal.producer}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs line-through text-muted-foreground font-body">
                                    CHF {deal.originalPrice}
                                  </span>
                                  <span className="text-sm font-body font-semibold text-wine-gold">
                                    CHF {deal.dealPrice}
                                  </span>
                                  <span className="text-xs font-body text-wine-gold">
                                    -{deal.discountPercent}%
                                  </span>
                                </div>
                                {deal.notes && (
                                  <p className="text-xs text-muted-foreground font-body mt-1">{deal.notes}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground font-body mt-1">
                                  {deal.validFrom} bis {deal.validUntil}
                                </p>
                              </div>
                              <button
                                onClick={() => removeDeal(merchant.id, deal.id)}
                                className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground font-body text-center py-4">
                        Noch keine Aktionen erfasst
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Noch keine Händler erfasst</p>
          <p className="text-xs text-muted-foreground/60 font-body mt-1">
            Füge deine Weinhändler hinzu und erfasse deren Aktionen
          </p>
        </div>
      )}

      {/* Add Merchant Dialog */}
      <Dialog open={showAddMerchant} onOpenChange={setShowAddMerchant}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Neuen Händler hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Name *</Label>
              <Input
                placeholder="z.B. Weinhandlung Kreis"
                value={merchantForm.name}
                onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Website</Label>
              <Input
                placeholder="z.B. www.weinhandlung-kreis.ch"
                value={merchantForm.website}
                onChange={(e) => setMerchantForm({ ...merchantForm, website: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Standort</Label>
              <Input
                placeholder="z.B. Zürich"
                value={merchantForm.location}
                onChange={(e) => setMerchantForm({ ...merchantForm, location: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Notizen</Label>
              <Textarea
                placeholder="Zusätzliche Infos zum Händler..."
                value={merchantForm.notes}
                onChange={(e) => setMerchantForm({ ...merchantForm, notes: e.target.value })}
                className="font-body"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMerchant(false)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleAddMerchant}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Merchant Dialog */}
      <Dialog open={!!editingMerchant} onOpenChange={() => setEditingMerchant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Händler bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Name *</Label>
              <Input
                value={merchantForm.name}
                onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Website</Label>
              <Input
                value={merchantForm.website}
                onChange={(e) => setMerchantForm({ ...merchantForm, website: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Standort</Label>
              <Input
                value={merchantForm.location}
                onChange={(e) => setMerchantForm({ ...merchantForm, location: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Notizen</Label>
              <Textarea
                value={merchantForm.notes}
                onChange={(e) => setMerchantForm({ ...merchantForm, notes: e.target.value })}
                className="font-body"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMerchant(null)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleEditMerchant}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={!!showAddDeal} onOpenChange={() => setShowAddDeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Aktion erfassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Weinname *</Label>
              <Input
                placeholder="z.B. Barolo Riserva 2016"
                value={dealForm.wineName}
                onChange={(e) => setDealForm({ ...dealForm, wineName: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Produzent</Label>
              <Input
                placeholder="z.B. Giacomo Conterno"
                value={dealForm.producer}
                onChange={(e) => setDealForm({ ...dealForm, producer: e.target.value })}
                className="font-body"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Normalpreis (CHF)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={dealForm.originalPrice || ""}
                  onChange={(e) => updateDealPrices("originalPrice", parseFloat(e.target.value) || 0)}
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Aktionspreis (CHF)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={dealForm.dealPrice || ""}
                  onChange={(e) => updateDealPrices("dealPrice", parseFloat(e.target.value) || 0)}
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Rabatt %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={dealForm.discountPercent || ""}
                  onChange={(e) => setDealForm({ ...dealForm, discountPercent: parseInt(e.target.value) || 0 })}
                  className="font-body"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Gültig von</Label>
                <Input
                  type="date"
                  value={dealForm.validFrom}
                  onChange={(e) => setDealForm({ ...dealForm, validFrom: e.target.value })}
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Gültig bis</Label>
                <Input
                  type="date"
                  value={dealForm.validUntil}
                  onChange={(e) => setDealForm({ ...dealForm, validUntil: e.target.value })}
                  className="font-body"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Notizen</Label>
              <Input
                placeholder="z.B. Online exklusiv, Mindestbestellmenge 6"
                value={dealForm.notes}
                onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                className="font-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDeal(null)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleAddDeal}>Erfassen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Merchants;
