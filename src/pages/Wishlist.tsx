import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Heart, Plus, Trash2, MapPin, Users, GlassWater, Camera, X, Pencil, Image, Star, ExternalLink, Smartphone, Loader2, Link2 } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { cn } from "@/lib/utils";
import { getWineTypeColor, getWineTypeLabel } from "@/data/wines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useWineStore } from "@/hooks/useWineStore";
import { WishlistItem } from "@/data/wines";
import { useToast } from "@/hooks/use-toast";
import { fetchWineDataFromUrl } from "@/lib/wineUrlParser";
import { buildVivinoWishlistItem, extractImportUrl, isVivinoUrl } from "@/lib/wishlistImport";

interface WishlistFormData {
  name: string;
  location: string;
  occasion: string;
  companions: string;
  notes: string;
  imageData: string;
}

const emptyForm: WishlistFormData = {
  name: "",
  location: "",
  occasion: "",
  companions: "",
  notes: "",
  imageData: "",
};

const Wishlist = () => {
  const { wishlistItems, addWishlistItem, updateWishlistItem, removeWishlistItem } = useWineStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showVivinoImport, setShowVivinoImport] = useState(false);
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [formData, setFormData] = useState<WishlistFormData>(emptyForm);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [vivinoInput, setVivinoInput] = useState("");
  const [isImportingVivino, setIsImportingVivino] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("Bild ist zu gross (max. 2 MB). Bitte ein kleineres Bild wählen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setFormData((prev) => ({ ...prev, imageData: compressed }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  };

  const onImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageFile(file);
  };

  const handleUpdate = () => {
    if (!editItem || !formData.name.trim()) return;
    updateWishlistItem(editItem.id, {
      name: formData.name.trim(),
      location: formData.location.trim(),
      occasion: formData.occasion.trim(),
      companions: formData.companions.trim(),
      notes: formData.notes.trim(),
      imageData: formData.imageData || undefined,
    });
    setEditItem(null);
    setFormData(emptyForm);
  };

  const openEdit = (item: WishlistItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      location: item.location,
      occasion: item.occasion,
      companions: item.companions,
      notes: item.notes || "",
      imageData: item.imageData || "",
    });
  };

  const closeDialog = () => {
    setEditItem(null);
    setFormData(emptyForm);
  };

  const closeVivinoDialog = () => {
    setShowVivinoImport(false);
    setVivinoInput("");
  };

  const openVivino = () => {
    window.open("https://www.vivino.com", "_blank", "noopener,noreferrer");
  };

  const handleVivinoImport = async () => {
    const sourceUrl = extractImportUrl(vivinoInput);

    if (!sourceUrl) {
      toast({
        title: "Vivino-Link fehlt",
        description: "Bitte füge den kopierten Vivino-Link ein.",
        variant: "destructive",
      });
      return;
    }

    if (!isVivinoUrl(sourceUrl)) {
      toast({
        title: "Ungültiger Link",
        description: "Bitte einen Link direkt von Vivino einfügen.",
        variant: "destructive",
      });
      return;
    }

    setIsImportingVivino(true);

    try {
      const data = await fetchWineDataFromUrl(sourceUrl);
      const item = buildVivinoWishlistItem(data, sourceUrl);
      addWishlistItem(item);
      closeVivinoDialog();
      toast({
        title: "Vivino importiert",
        description: `${item.name} wurde in die Merkliste übernommen.`,
      });
    } catch (error) {
      const description = error instanceof Error
        ? error.message
        : "Der Vivino-Link konnte nicht verarbeitet werden.";
      toast({
        title: "Import fehlgeschlagen",
        description,
        variant: "destructive",
      });
    } finally {
      setIsImportingVivino(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatRating = (rating: number) => rating.toLocaleString("de-CH", { maximumFractionDigits: 1 });

  const formDialog = (
    <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Eintrag bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Image upload */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm">Bild der Flasche</Label>
            {formData.imageData ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img
                  src={formData.imageData}
                  alt="Flasche"
                  className="w-full h-full object-contain bg-black/20"
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageData: "" }))}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="rounded-lg border-2 border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-primary/70" />
                  <span className="text-sm text-foreground font-body">Foto aufnehmen</span>
                </button>
                <label
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onImageDrop}
                  className={cn(
                    "relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors cursor-pointer overflow-hidden",
                    isDragging
                      ? "border-primary/60 bg-primary/8 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Image className={cn("w-8 h-8", isDragging ? "text-primary/70" : "text-muted-foreground/60")} />
                  <span className={cn("text-sm font-body", isDragging ? "text-foreground" : "text-muted-foreground")}>
                    {isDragging ? "Loslassen" : "Hochladen"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Weinname *</Label>
            <Input
              placeholder="z.B. Amarone della Valpolicella 2015"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Ort</Label>
            <Input
              placeholder="z.B. Restaurant Kronenhalle, Zürich"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Trinkgelegenheit</Label>
            <Input
              placeholder="z.B. Geburtstagsessen, Weinmesse"
              value={formData.occasion}
              onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Mit wem getrunken</Label>
            <Input
              placeholder="z.B. Familie, Freunde, alleine"
              value={formData.companions}
              onChange={(e) => setFormData({ ...formData, companions: e.target.value })}
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Notizen</Label>
            <Textarea
              placeholder="z.B. Unglaublich vollmundig, muss ich haben..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="font-body resize-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>Abbrechen</Button>
          <Button variant="wine" onClick={handleUpdate}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const vivinoDialog = (
    <Dialog
      open={showVivinoImport}
      onOpenChange={(open) => {
        if (!open) {
          closeVivinoDialog();
          return;
        }
        setShowVivinoImport(true);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Aus Vivino übernehmen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7b2038]/10 text-[#7b2038] flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Vivino scannen und Link teilen</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Öffne in Vivino den erkannten Wein, tippe auf Teilen und kopiere den Link hierher.
                </p>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full justify-center" onClick={openVivino}>
              <ExternalLink className="w-4 h-4" />
              Vivino öffnen
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Vivino-Link</Label>
            <Input
              placeholder="https://www.vivino.com/…"
              value={vivinoInput}
              onChange={(e) => setVivinoInput(e.target.value)}
              className="font-body"
            />
            <p className="text-xs text-muted-foreground">
              Du kannst auch direkt den geteilten Text einfügen. Der Link wird automatisch herausgezogen.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeVivinoDialog} disabled={isImportingVivino}>Abbrechen</Button>
          <Button variant="wine" onClick={handleVivinoImport} disabled={isImportingVivino}>
            {isImportingVivino ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importiere…
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                In Merkliste
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const imagePreviewDialog = (
    <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
      <DialogContent className="max-w-lg p-2">
        {previewImage && (
          <img
            src={previewImage}
            alt="Flasche"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-5 animate-fade-in">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
          <h1 className="text-2xl font-display font-bold tracking-tight">Merkliste</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {wishlistItems.length} {wishlistItems.length === 1 ? "Wein" : "Weine"} gemerkt
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="wine" size="sm" onClick={() => setShowVivinoImport(true)} className="gap-1.5">
            <Smartphone className="w-4 h-4" />
            Vivino
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/add?mode=merkliste&return=/wishlist")} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Manuell
          </Button>
        </div>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((item, i) => (
            <div
              key={item.id}
              className="glass-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Image */}
              {item.imageData ? (
                <button
                  onClick={() => setPreviewImage(item.imageData!)}
                  className="w-full h-44 overflow-hidden bg-black/20 cursor-pointer"
                >
                  <img
                    src={item.imageData}
                    alt={item.name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ) : (
                <div className="w-full h-28 bg-muted/30 flex items-center justify-center">
                  <Image className="w-10 h-10 text-muted-foreground/20" />
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {(item.source === "vivino" || item.type) && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {item.source === "vivino" && (
                          <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-[#7b2038]/10 text-[#7b2038]">
                            Vivino
                          </span>
                        )}
                        {item.type && (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-md font-medium ${getWineTypeColor(item.type)}`}>
                            {getWineTypeLabel(item.type)}
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="font-display font-semibold text-sm leading-tight truncate">{item.name}</h3>
                    {item.producer && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.producer}{item.vintage ? ` · ${item.vintage}` : ""}</p>
                    )}
                    {(item.region || item.country) && (
                      <p className="text-xs text-muted-foreground/60 truncate">{[item.region, item.country].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {(!item.source || item.source === "manual") && (
                      <button onClick={() => openEdit(item)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => removeWishlistItem(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                {item.rating && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {formatRating(item.rating)}
                  </div>
                )}

                {/* Tasted info */}
                {item.tastedDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GlassWater className="w-3 h-3 flex-shrink-0" />
                    <span>{formatDate(item.tastedDate)}{item.tastedLocation ? ` · ${item.tastedLocation}` : ""}</span>
                  </div>
                )}

                {/* Manual entry fields */}
                {item.location && !item.tastedDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.occasion && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GlassWater className="w-3 h-3 flex-shrink-0" />
                    <span>{item.occasion}</span>
                  </div>
                )}
                {item.companions && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{item.companions}</span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-muted-foreground/70 italic line-clamp-2">{item.notes}</p>
                )}

                {item.source === "vivino" && item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Auf Vivino öffnen
                  </a>
                )}

                <p className="text-[10px] text-muted-foreground/40 pt-1">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="apple-card p-12 text-center animate-fade-in">
          <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-semibold">Merkliste ist leer</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Erfasse Weine mit "Nur Registrieren", importiere sie aus Vivino oder füge sie manuell hinzu
          </p>
        </div>
      )}

      {formDialog}
      {vivinoDialog}
      {imagePreviewDialog}
      <CameraCapture
        open={showCamera}
        onCapture={(file) => { handleImageFile(file); setShowCamera(false); }}
        onClose={() => setShowCamera(false)}
      />
    </AppLayout>
  );
};

export default Wishlist;
