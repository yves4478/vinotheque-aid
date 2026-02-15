import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Heart, Plus, Trash2, MapPin, Users, GlassWater, Camera, X, Pencil, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useWineStore } from "@/hooks/useWineStore";
import { WishlistItem } from "@/data/wines";

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
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [formData, setFormData] = useState<WishlistFormData>(emptyForm);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 2MB to keep localStorage reasonable
    if (file.size > 2 * 1024 * 1024) {
      alert("Bild ist zu gross (max. 2 MB). Bitte ein kleineres Bild wählen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;

      // Resize image to keep storage small
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

  const handleAdd = () => {
    if (!formData.name.trim()) return;
    addWishlistItem({
      name: formData.name.trim(),
      location: formData.location.trim(),
      occasion: formData.occasion.trim(),
      companions: formData.companions.trim(),
      notes: formData.notes.trim(),
      imageData: formData.imageData || undefined,
    });
    setFormData(emptyForm);
    setShowAdd(false);
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
    setShowAdd(false);
    setEditItem(null);
    setFormData(emptyForm);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formDialog = (
    <Dialog open={showAdd || !!editItem} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editItem ? "Wunsch bearbeiten" : "Wein zur Wunschliste"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Image upload */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm">Bild der Flasche</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
            {formData.imageData ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img
                  src={formData.imageData}
                  alt="Flasche"
                  className="w-full h-full object-contain bg-black/20"
                />
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, imageData: "" }))}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground font-body">Foto aufnehmen oder Bild wählen</span>
              </button>
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
          <Button variant="wine" onClick={editItem ? handleUpdate : handleAdd}>
            {editItem ? "Speichern" : "Hinzufügen"}
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
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Wunschliste</h1>
          <p className="text-muted-foreground font-body mt-1">
            {wishlistItems.length} {wishlistItems.length === 1 ? "Wein" : "Weine"} gemerkt
          </p>
        </div>
        <Button variant="wine" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Hinzufügen
        </Button>
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
                  <h3 className="font-display font-semibold text-sm leading-tight">{item.name}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-muted-foreground/40 hover:text-wine-gold transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeWishlistItem(item.id)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{item.location}</span>
                  </div>
                )}

                {item.occasion && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                    <GlassWater className="w-3 h-3 flex-shrink-0" />
                    <span>{item.occasion}</span>
                  </div>
                )}

                {item.companions && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{item.companions}</span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-wine-gold font-body mt-1">{item.notes}</p>
                )}

                <p className="text-[10px] text-muted-foreground/50 font-body pt-1">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Deine Wunschliste ist leer</p>
          <p className="text-sm text-muted-foreground/60 font-body mt-1">
            Merke dir Weine die du irgendwo entdeckst und toll findest
          </p>
        </div>
      )}

      {formDialog}
      {imagePreviewDialog}
    </AppLayout>
  );
};

export default Wishlist;
