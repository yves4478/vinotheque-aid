// Wein erfassen

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  formatCurrencyForLocale,
  formatDateForLocale,
  getCurrencyPlaceholder,
  getDatePlaceholder,
  normalizeDateInput,
  parseDateInput,
  parseLocaleNumber,
  toIsoDate,
} from "@/lib/localeFormat";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { useWineStore } from "@/store/useWineStore";
import type { ShoppingItem, Wine, WineType, WishlistItem } from "@vinotheque/core";
import {
  BOTTLE_SIZES,
  countries,
  createId,
  getRegionsForCountry,
} from "@vinotheque/core";

type StorageMode = "cellar" | "wishlist" | "shopping";
type FormErrors = Partial<Record<
  | "name"
  | "producer"
  | "quantity"
  | "country"
  | "region"
  | "purchasePrice"
  | "purchaseDate"
  | "tastedDate"
  | "drinkUntil"
  | "giftFrom"
  | "purchaseLink",
  string
>>;

const currentYear = new Date().getFullYear();

const WINE_TYPES: SelectOption[] = [
  { value: "rot", label: "Rotwein" },
  { value: "weiss", label: "Weisswein" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaumwein" },
  { value: "dessert", label: "Dessertwein" },
];

const YEAR_OPTIONS: SelectOption[] = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => {
  const year = currentYear - index;
  return { value: String(year), label: String(year) };
});

const DRINK_YEAR_OPTIONS: SelectOption[] = Array.from({ length: 61 }, (_, index) => {
  const year = currentYear - 10 + index;
  return { value: String(year), label: String(year) };
});

const BOTTLE_SIZE_OPTIONS: SelectOption[] = BOTTLE_SIZES.map((size) => ({
  value: size.value,
  label: size.label,
}));

function resolveStorageMode(raw: unknown): StorageMode {
  if (raw === "shopping") return "shopping";
  if (raw === "wishlist" || raw === "tasted" || raw === "merkliste") return "wishlist";
  return "cellar";
}

function sanitizePositiveInteger(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return String(Math.max(1, Number(digits)));
}

function normalizeCurrencyInput(value: string): string {
  if (!value.trim()) return "";
  return formatCurrencyForLocale(parseLocaleNumber(value));
}

function isValidHttpsUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function AddWineScreen() {
  const { wines, addWine, addWishlistItem, addShoppingItem } = useWineStore();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [storageMode, setStorageMode] = useState<StorageMode>(() => resolveStorageMode(params.mode));
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState(String(currentYear));
  const [type, setType] = useState<WineType>("rot");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [grape, setGrape] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [drinkFrom, setDrinkFrom] = useState(String(currentYear));
  const [drinkUntil, setDrinkUntil] = useState(String(currentYear + 5));
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(formatDateForLocale(new Date()));
  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [isGift, setIsGift] = useState(false);
  const [giftFrom, setGiftFrom] = useState("");
  const [isRarity, setIsRarity] = useState(false);
  const [bottleSize, setBottleSize] = useState("standard");
  const [purchaseLink, setPurchaseLink] = useState("");
  const [tastedDate, setTastedDate] = useState(formatDateForLocale(new Date()));
  const [tastedLocation, setTastedLocation] = useState("");
  const [occasion, setOccasion] = useState("");
  const [companions, setCompanions] = useState("");
  const [shoppingReason, setShoppingReason] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [duplicateHint, setDuplicateHint] = useState("");

  useEffect(() => {
    setStorageMode(resolveStorageMode(params.mode));
  }, [params.mode]);

  const regionOptions = useMemo(
    () => getRegionsForCountry(country).map((entry) => ({ value: entry, label: entry })),
    [country],
  );

  const countryOptions = useMemo(
    () => countries.map((entry) => ({ value: entry, label: entry })),
    [],
  );
  const datePlaceholder = getDatePlaceholder();
  const currencyPlaceholder = getCurrencyPlaceholder();

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function setMode(mode: StorageMode) {
    setStorageMode(mode);
    setErrors({});
  }

  function updateQuantity(value: string) {
    setQuantity(sanitizePositiveInteger(value));
    clearError("quantity");
  }

  function checkDuplicate() {
    const normalizedName = name.trim().toLowerCase();
    const normalizedProducer = producer.trim().toLowerCase();
    if (!normalizedName || !normalizedProducer) {
      setDuplicateHint("");
      return;
    }

    const existing = wines.find((wine) => (
      wine.name.trim().toLowerCase() === normalizedName &&
      wine.producer.trim().toLowerCase() === normalizedProducer &&
      wine.vintage === Number(vintage)
    ));
    setDuplicateHint(existing ? "Dieser Wein ist mit gleichem Produzent und Jahrgang bereits im Keller." : "");
  }

  async function saveImageLocally(uri: string): Promise<string> {
    const filename = `wine_${Date.now()}.jpg`;
    if (!FileSystem.documentDirectory) {
      throw new Error("Expo document directory is not available.");
    }
    const dest = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
    });
    if (!result.canceled) {
      const localUri = await saveImageLocally(result.assets[0].uri);
      setImageUri(localUri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Kamera nicht freigegeben", "Bitte erlaube den Kamerazugriff, um Etiketten zu fotografieren.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
    });

    if (!result.canceled) {
      const localUri = await saveImageLocally(result.assets[0].uri);
      setImageUri(localUri);
    }
  }

  function validateRequired(): boolean {
    const nextErrors: FormErrors = {};
    const parsedPrice = parseLocaleNumber(purchasePrice);
    const parsedQuantity = Number(quantity);
    const drinkFromYear = Number(drinkFrom);
    const drinkUntilYear = Number(drinkUntil);

    if (!name.trim() || !producer.trim()) {
      if (!name.trim()) nextErrors.name = "Bitte Weinname erfassen.";
      if (!producer.trim()) nextErrors.producer = "Bitte Produzent erfassen.";
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      nextErrors.quantity = "Bitte mindestens 1 Flasche erfassen.";
    }
    if (purchasePrice.trim() && parsedPrice < 0) {
      nextErrors.purchasePrice = "Preis darf nicht negativ sein.";
    }
    if (storageMode === "cellar" && !country) {
      nextErrors.country = "Bitte Land auswählen.";
    }
    if (storageMode === "cellar" && !region) {
      nextErrors.region = "Bitte Region auswählen.";
    }
    if (storageMode === "cellar" && purchaseDate.trim() && !parseDateInput(purchaseDate)) {
      nextErrors.purchaseDate = `Bitte Datum im Geräteformat eingeben, z.B. ${datePlaceholder}.`;
    }
    if (storageMode === "cellar" && drinkUntilYear < drinkFromYear) {
      nextErrors.drinkUntil = "Trinken bis darf nicht vor Trinken ab liegen.";
    }
    if (storageMode === "cellar" && !isValidHttpsUrl(purchaseLink)) {
      nextErrors.purchaseLink = "Bitte einen gültigen Link erfassen.";
    }
    if (storageMode === "wishlist" && tastedDate.trim() && !parseDateInput(tastedDate)) {
      nextErrors.tastedDate = `Bitte Datum im Geräteformat eingeben, z.B. ${datePlaceholder}.`;
    }
    if (isGift && !giftFrom.trim()) {
      nextErrors.giftFrom = "Bitte erfassen, von wem das Geschenk stammt.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Alert.alert("Bitte prüfen", "Einige Angaben fehlen oder haben ein ungültiges Format.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validateRequired()) return;

    const parsedQuantity = Math.max(1, Number(quantity) || 1);
    const parsedPrice = parseLocaleNumber(purchasePrice);
    const purchaseDateIso = parseDateInput(purchaseDate) ?? toIsoDate(new Date());
    const tastedDateIso = parseDateInput(tastedDate) ?? toIsoDate(new Date());

    try {
      if (storageMode === "shopping") {
        const item: ShoppingItem = {
          id: createId(),
          name: name.trim(),
          producer: producer.trim(),
          quantity: Math.max(1, parsedQuantity),
          estimatedPrice: parsedPrice,
          reason: shoppingReason.trim(),
          checked: false,
        };
        await addShoppingItem(item);
        router.replace("/(tabs)/shopping");
        return;
      }

      if (storageMode === "wishlist") {
        const item: WishlistItem = {
          id: createId(),
          name: name.trim(),
          producer: producer.trim() || undefined,
          vintage: Number(vintage) || currentYear,
          type,
          region: region || undefined,
          country: country || undefined,
          grape: grape.trim() || undefined,
          rating: personalRating,
          notes: notes.trim() || undefined,
          imageUri,
          tastedDate: tastedDateIso,
          tastedLocation: tastedLocation.trim() || undefined,
          price: parsedPrice || undefined,
          location: tastedLocation.trim(),
          occasion: occasion.trim(),
          companions: companions.trim(),
          createdAt: new Date().toISOString(),
          source: "add-wine",
        };
        await addWishlistItem(item);
        router.replace("/(tabs)/wishlist");
        return;
      }

      const wine: Wine = {
        id: createId(),
        name: name.trim(),
        producer: producer.trim(),
        vintage: Number(vintage) || currentYear,
        type,
        region,
        country,
        grape: grape.trim(),
          quantity: Math.max(1, parsedQuantity),
        purchasePrice: parsedPrice,
        purchaseDate: purchaseDateIso,
        purchaseLocation: purchaseLocation.trim(),
        storageLocation: storageLocation.trim() || undefined,
        drinkFrom: Number(drinkFrom) || currentYear,
        drinkUntil: Number(drinkUntil) || currentYear + 5,
        personalRating,
        notes: notes.trim() || undefined,
        imageUri,
        purchaseLink: purchaseLink.trim() || undefined,
        isGift,
        giftFrom: isGift ? giftFrom.trim() || undefined : undefined,
        isRarity,
        bottleSize,
      };
      await addWine(wine);
      router.replace("/(tabs)/");
    } catch {
      Alert.alert("Fehler", "Der Eintrag konnte nicht gespeichert werden.");
    }
  }

  const saveLabel =
    storageMode === "shopping"
      ? "Auf Einkaufsliste speichern"
      : storageMode === "wishlist"
        ? "Auf Merkliste speichern"
        : "In den Keller speichern";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Ziel</Text>
        <View style={styles.modeGrid}>
          <ModeButton
            active={storageMode === "cellar"}
            label="Keller"
            detail="Flaschen einlagern"
            onPress={() => setMode("cellar")}
          />
          <ModeButton
            active={storageMode === "wishlist"}
            label="Merkliste"
            detail="Getrunken, gesehen"
            onPress={() => setMode("wishlist")}
          />
          <ModeButton
            active={storageMode === "shopping"}
            label="Einkauf"
            detail="Für später merken"
            onPress={() => setMode("shopping")}
          />
        </View>

        <Text style={styles.sectionTitle}>Basisdaten</Text>
        <SelectField
          label="Weintyp"
          value={type}
          onValueChange={(value) => setType(value as WineType)}
          options={WINE_TYPES}
          testID="add-wine-type-select"
        />

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(value) => {
            setName(value);
            clearError("name");
          }}
          onBlur={checkDuplicate}
          placeholder="z.B. Barolo Riserva"
          testID="add-wine-name-input"
        />
        <FieldError message={errors.name} />

        <Text style={styles.label}>Produzent *</Text>
        <TextInput
          style={styles.input}
          value={producer}
          onChangeText={(value) => {
            setProducer(value);
            clearError("producer");
          }}
          onBlur={checkDuplicate}
          placeholder="z.B. Giacomo Conterno"
          testID="add-wine-producer-input"
        />
        <FieldError message={errors.producer || duplicateHint} muted={!!duplicateHint && !errors.producer} />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <SelectField
              label="Jahrgang"
              value={vintage}
              onValueChange={(value) => {
                setVintage(value);
                setDuplicateHint("");
              }}
              options={YEAR_OPTIONS}
              testID="add-wine-vintage-select"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.labelCompact}>Anzahl</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={updateQuantity}
              onBlur={() => setQuantity((prev) => sanitizePositiveInteger(prev) || "1")}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <FieldError message={errors.quantity} />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <SelectField
              label="Land"
              value={country}
              onValueChange={(value) => {
                setCountry(value);
                setRegion("");
                clearError("country");
              }}
              options={countryOptions}
              placeholder="Land wählen"
              testID="add-wine-country-select"
            />
          </View>
          <View style={styles.halfField}>
            <SelectField
              label="Region"
              value={region}
              onValueChange={(value) => {
                setRegion(value);
                clearError("region");
              }}
              options={regionOptions}
              placeholder={country ? "Region wählen" : "Erst Land wählen"}
              disabled={!country}
              testID="add-wine-region-select"
            />
          </View>
        </View>
        <FieldError message={errors.country || errors.region} />

        <Text style={styles.label}>Traube(n)</Text>
        <TextInput style={styles.input} value={grape} onChangeText={setGrape} placeholder="z.B. Nebbiolo" />

        {storageMode === "cellar" && (
          <>
            <Text style={styles.sectionTitle}>Kauf & Keller</Text>
            <Text style={styles.label}>Kaufpreis pro Flasche</Text>
            <TextInput
              style={styles.input}
              value={purchasePrice}
              onChangeText={(value) => {
                setPurchasePrice(value);
                clearError("purchasePrice");
              }}
              onBlur={() => setPurchasePrice(normalizeCurrencyInput(purchasePrice))}
              keyboardType="decimal-pad"
              placeholder={currencyPlaceholder}
            />
            <FieldError message={errors.purchasePrice} />

            <Text style={styles.label}>Kaufort</Text>
            <TextInput style={styles.input} value={purchaseLocation} onChangeText={setPurchaseLocation} placeholder="z.B. Weinhandlung Kreis" />

            <Text style={styles.label}>Lagerort</Text>
            <TextInput
              style={styles.input}
              value={storageLocation}
              onChangeText={setStorageLocation}
              placeholder="z.B. Keller A / Regal 2 / Fach 4"
            />

            <Text style={styles.label}>Kaufdatum</Text>
            <TextInput
              style={styles.input}
              value={purchaseDate}
              onChangeText={(value) => {
                setPurchaseDate(value);
                clearError("purchaseDate");
              }}
              onBlur={() => setPurchaseDate(normalizeDateInput(purchaseDate))}
              placeholder={datePlaceholder}
              keyboardType="numbers-and-punctuation"
            />
            <FieldError message={errors.purchaseDate} />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <SelectField
                  label="Trinken ab"
                  value={drinkFrom}
                  onValueChange={setDrinkFrom}
                  options={DRINK_YEAR_OPTIONS}
                  testID="add-wine-drink-from-select"
                />
              </View>
              <View style={styles.halfField}>
                <SelectField
                  label="Trinken bis"
                  value={drinkUntil}
                  onValueChange={(value) => {
                    setDrinkUntil(value);
                    clearError("drinkUntil");
                  }}
                  options={DRINK_YEAR_OPTIONS}
                  testID="add-wine-drink-until-select"
                />
              </View>
            </View>
            <FieldError message={errors.drinkUntil} />

            <SelectField
              label="Flaschengrösse"
              value={bottleSize}
              onValueChange={setBottleSize}
              options={BOTTLE_SIZE_OPTIONS}
              testID="add-wine-bottle-size-select"
            />

            <Text style={styles.label}>Kauflink</Text>
            <TextInput
              style={styles.input}
              value={purchaseLink}
              onChangeText={(value) => {
                setPurchaseLink(value);
                clearError("purchaseLink");
              }}
              placeholder="https://..."
              keyboardType="url"
              autoCapitalize="none"
            />
            <FieldError message={errors.purchaseLink} />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Geschenk</Text>
                <Text style={styles.switchHint}>Herkunft optional erfassen</Text>
              </View>
              <Switch
                value={isGift}
                onValueChange={setIsGift}
                thumbColor={isGift ? WINE_RED : "#f4f4f5"}
                trackColor={{ false: "#d6d1cf", true: "#c58b8b" }}
              />
            </View>

            {isGift && (
              <>
                <Text style={styles.label}>Geschenk von</Text>
                <TextInput
                  style={styles.input}
                  value={giftFrom}
                  onChangeText={(value) => {
                    setGiftFrom(value);
                    clearError("giftFrom");
                  }}
                  placeholder="z.B. Tante Maria"
                />
                <FieldError message={errors.giftFrom} />
              </>
            )}

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Rarität</Text>
                <Text style={styles.switchHint}>Besondere Flasche markieren</Text>
              </View>
              <Switch
                value={isRarity}
                onValueChange={setIsRarity}
                thumbColor={isRarity ? WINE_RED : "#f4f4f5"}
                trackColor={{ false: "#d6d1cf", true: "#c58b8b" }}
              />
            </View>
          </>
        )}

        {storageMode === "wishlist" && (
          <>
            <Text style={styles.sectionTitle}>Merkliste</Text>
            <Text style={styles.label}>Datum</Text>
            <TextInput
              style={styles.input}
              value={tastedDate}
              onChangeText={(value) => {
                setTastedDate(value);
                clearError("tastedDate");
              }}
              onBlur={() => setTastedDate(normalizeDateInput(tastedDate))}
              placeholder={datePlaceholder}
              keyboardType="numbers-and-punctuation"
            />
            <FieldError message={errors.tastedDate} />

            <Text style={styles.label}>Preis</Text>
            <TextInput
              style={styles.input}
              value={purchasePrice}
              onChangeText={(value) => {
                setPurchasePrice(value);
                clearError("purchasePrice");
              }}
              onBlur={() => setPurchasePrice(normalizeCurrencyInput(purchasePrice))}
              keyboardType="decimal-pad"
              placeholder={currencyPlaceholder}
            />
            <FieldError message={errors.purchasePrice} />

            <Text style={styles.label}>Ort</Text>
            <TextInput style={styles.input} value={tastedLocation} onChangeText={setTastedLocation} placeholder="z.B. Restaurant Kronenhalle" />

            <Text style={styles.label}>Anlass</Text>
            <TextInput style={styles.input} value={occasion} onChangeText={setOccasion} placeholder="z.B. Geburtstagsessen" />

            <Text style={styles.label}>Begleitung</Text>
            <TextInput style={styles.input} value={companions} onChangeText={setCompanions} placeholder="z.B. Familie, Freunde" />
          </>
        )}

        {storageMode === "shopping" && (
          <>
            <Text style={styles.sectionTitle}>Einkauf</Text>
            <Text style={styles.label}>Geschätzter Preis</Text>
            <TextInput
              style={styles.input}
              value={purchasePrice}
              onChangeText={(value) => {
                setPurchasePrice(value);
                clearError("purchasePrice");
              }}
              onBlur={() => setPurchasePrice(normalizeCurrencyInput(purchasePrice))}
              keyboardType="decimal-pad"
              placeholder={currencyPlaceholder}
            />
            <FieldError message={errors.purchasePrice} />

            <Text style={styles.label}>Grund / Notiz</Text>
            <TextInput style={styles.input} value={shoppingReason} onChangeText={setShoppingReason} placeholder="z.B. Lieblingswein auffüllen" />
          </>
        )}

        {(storageMode === "cellar" || storageMode === "wishlist") && (
          <>
            <Text style={styles.sectionTitle}>Foto</Text>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
                <Text style={styles.imageBtnText}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                <Text style={styles.imageBtnText}>Mediathek</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.label}>Persönliche Bewertung</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={styles.starButton}
              onPress={() => setPersonalRating(rating)}
            >
              <Text style={[
                styles.starText,
                personalRating !== undefined && rating <= personalRating ? styles.starTextActive : undefined,
              ]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notizen</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Verkostungsnotizen…"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saveLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeButton({
  active,
  label,
  detail,
  onPress,
}: {
  active: boolean;
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
      <Text style={[styles.modeDetail, active && styles.modeDetailActive]} numberOfLines={1}>
        {detail}
      </Text>
    </TouchableOpacity>
  );
}

function FieldError({ message, muted = false }: { message?: string; muted?: boolean }) {
  if (!message) return null;
  return <Text style={[styles.fieldError, muted && styles.fieldHint]}>{message}</Text>;
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: WINE_RED,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeGrid: { flexDirection: "row", gap: 8 },
  modeButton: {
    flex: 1,
    minHeight: 68,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: "center",
  },
  modeButtonActive: { backgroundColor: WINE_RED, borderColor: WINE_RED },
  modeLabel: { fontSize: 14, fontWeight: "800", color: "#2b211e", textAlign: "center" },
  modeLabelActive: { color: "#fff" },
  modeDetail: { fontSize: 11, color: "#776c67", marginTop: 3, textAlign: "center" },
  modeDetailActive: { color: "#f8e9e9" },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 4, marginTop: 4 },
  labelCompact: { fontSize: 12, fontWeight: "700", color: "#6f625d", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1a0500",
  },
  fieldError: { color: "#dc2626", fontSize: 12, fontWeight: "700", marginTop: -4 },
  fieldHint: { color: "#a26f27" },
  textarea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-end" },
  halfField: { flex: 1 },
  ratingRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  starButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  starText: { fontSize: 30, color: "#d8d0cc" },
  starTextActive: { color: "#d59a20" },
  switchRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchLabel: { fontSize: 14, fontWeight: "700", color: "#333" },
  switchHint: { fontSize: 12, color: "#777", marginTop: 2 },
  photoRow: { flexDirection: "row", gap: 10 },
  previewImage: { width: "100%", height: 220, borderRadius: 12, backgroundColor: "#1a0500" },
  imageBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WINE_RED,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  imageBtnText: { color: WINE_RED, fontWeight: "700" },
  saveBtn: {
    marginTop: 10,
    backgroundColor: WINE_RED,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
