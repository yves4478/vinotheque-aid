// Wein erfassen

import {
  ActivityIndicator,
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
  normalizeCurrencyCode,
  normalizeDateInput,
  parseDateInput,
  parseLocaleNumber,
  toIsoDate,
} from "@/lib/localeFormat";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { useWineStore } from "@/store/useWineStore";
import type { ShoppingItem, Wine, WineImage, WineType, WishlistItem } from "@vinotheque/core";
import {
  BOTTLE_SIZES,
  OTHER_GRAPE_OPTION,
  countries,
  createId,
  createWineImage,
  draftToWineValues,
  enrichRecognizedWineDraft,
  formatGrapeList,
  getGrapesForCountry,
  getPrimaryWineImage,
  getRegionsForCountry,
  parseGrapeList,
  scanWithClaudeVision,
} from "@vinotheque/core";
import type { GrapeEntryMode } from "@vinotheque/core";

type StorageMode = "cellar" | "wishlist" | "shopping";
type FlowStep = 1 | 2 | 3;
type ScanDecision = "pending" | "scanned" | "skipped";
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

function normalizeCurrencyInput(value: string, currency: string): string {
  if (!value.trim()) return "";
  return formatCurrencyForLocale(parseLocaleNumber(value), currency);
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
  const { wines, addWine, addWishlistItem, addShoppingItem, settings } = useWineStore();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [storageMode, setStorageMode] = useState<StorageMode>(() => resolveStorageMode(params.mode));
  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [scanDecision, setScanDecision] = useState<ScanDecision>("pending");
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState(String(currentYear));
  const [type, setType] = useState<WineType>("rot");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [grape, setGrape] = useState("");
  const [grapeMode, setGrapeMode] = useState<GrapeEntryMode>("single");
  const [customAssemblageGrape, setCustomAssemblageGrape] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [drinkFrom, setDrinkFrom] = useState(String(currentYear));
  const [drinkUntil, setDrinkUntil] = useState(String(currentYear + 5));
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<WineImage[]>([]);
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
  const [scanBusy, setScanBusy] = useState(false);

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
  const grapeOptions = useMemo(
    () => getGrapesForCountry(country).map((entry) => ({ value: entry, label: entry })),
    [country],
  );
  const selectedGrapes = useMemo(() => parseGrapeList(grape), [grape]);
  const assemblageOptions = useMemo(
    () => grapeOptions.filter((option) => !selectedGrapes.includes(option.value)),
    [grapeOptions, selectedGrapes],
  );
  const datePlaceholder = getDatePlaceholder();
  const currency = normalizeCurrencyCode(settings.currency);
  const currencyPlaceholder = getCurrencyPlaceholder(currency);

  useEffect(() => {
    if (selectedGrapes.length > 1) {
      setGrapeMode("assemblage");
    } else if (selectedGrapes.length === 1 && !grapeOptions.some((option) => option.value === selectedGrapes[0])) {
      setGrapeMode("other");
    }
  }, [grapeOptions, selectedGrapes]);

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

  function skipScan() {
    setScanDecision("skipped");
    setCurrentStep(2);
  }

  function selectStorageMode(mode: StorageMode) {
    setMode(mode);
    setCurrentStep(3);
  }

  function updateQuantity(value: string) {
    setQuantity(sanitizePositiveInteger(value));
    clearError("quantity");
  }

  function switchGrapeMode(mode: GrapeEntryMode) {
    setGrapeMode(mode);
    setGrape("");
    setCustomAssemblageGrape("");
  }

  function selectSingleGrape(value: string) {
    if (value === OTHER_GRAPE_OPTION) {
      switchGrapeMode("other");
      return;
    }
    setGrape(value);
  }

  function addAssemblageGrape(value: string) {
    setGrape(formatGrapeList(new Set([...selectedGrapes, value])));
  }

  function addCustomAssemblageGrape() {
    const custom = customAssemblageGrape.trim();
    if (!custom) return;
    setGrape(formatGrapeList(new Set([...selectedGrapes, custom])));
    setCustomAssemblageGrape("");
  }

  function removeAssemblageGrape(value: string) {
    setGrape(formatGrapeList(selectedGrapes.filter((entry) => entry !== value)));
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

  function addLocalImage(uri: string) {
    setImages((current) => {
      if (current.length >= 3) {
        Alert.alert("Maximal 3 Bilder", "Pro Wein koennen bis zu drei Bilder gespeichert werden.");
        return current;
      }
      return [
        ...current,
        createWineImage(uri, current.length === 0 ? "Flasche" : "Etikett", current.length === 0),
      ];
    });
  }

  function removeImage(imageId: string) {
    setImages((current) => current
      .filter((image) => image.id !== imageId)
      .map((image, index) => ({ ...image, isPrimary: index === 0 })));
  }

  function makePrimaryImage(imageId: string) {
    setImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })));
  }

  function applyRecognizedValues(values: ReturnType<typeof draftToWineValues>) {
    if (values.name) {
      setName(values.name);
      clearError("name");
    }
    if (values.producer) {
      setProducer(values.producer);
      clearError("producer");
    }
    if (values.vintage) {
      setVintage(String(values.vintage));
      setDuplicateHint("");
    }
    if (values.country) {
      setCountry(values.country);
      clearError("country");
      if (!values.region) {
        setRegion("");
      }
    }
    if (values.region) {
      setRegion(values.region);
      clearError("region");
    }
    if (values.grape) {
      setGrape(values.grape);
    }
    if (values.type) {
      setType(values.type);
    }
  }

  async function scanLabelFromAsset(asset: ImagePicker.ImagePickerAsset) {
    const apiKey = settings.anthropicApiKey?.trim();
    if (!apiKey) {
      Alert.alert(
        "Anthropic API-Key fehlt",
        "Bitte hinterlege in den Einstellungen einen persönlichen Anthropic API-Key, damit die App Etiketten analysieren kann.",
      );
      return;
    }

    setScanBusy(true);
    try {
      const localUri = await saveImageLocally(asset.uri);
      addLocalImage(localUri);

      const imageBase64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const draft = enrichRecognizedWineDraft(
        await scanWithClaudeVision(imageBase64, apiKey, asset.mimeType ?? "image/jpeg"),
      );

      applyRecognizedValues(draftToWineValues(draft));
      setScanDecision("scanned");
      setCurrentStep(2);
      Alert.alert("Etikett erkannt", "Bild und Felder wurden vorausgefüllt. Bitte prüfe die Angaben.");
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Der Etiketten-Scan ist fehlgeschlagen.";
      Alert.alert("Scan fehlgeschlagen", message);
    } finally {
      setScanBusy(false);
    }
  }

  async function pickImage() {
    if (images.length >= 3) {
      Alert.alert("Maximal 3 Bilder", "Pro Wein koennen bis zu drei Bilder gespeichert werden.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
    });
    if (!result.canceled) {
      const localUri = await saveImageLocally(result.assets[0].uri);
      addLocalImage(localUri);
    }
  }

  async function takePhoto() {
    if (images.length >= 3) {
      Alert.alert("Maximal 3 Bilder", "Pro Wein koennen bis zu drei Bilder gespeichert werden.");
      return;
    }
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
      addLocalImage(localUri);
    }
  }

  async function pickImageForScan() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
    });
    if (!result.canceled) {
      await scanLabelFromAsset(result.assets[0]);
    }
  }

  async function takePhotoForScan() {
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
      await scanLabelFromAsset(result.assets[0]);
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
    const primaryImage = getPrimaryWineImage({ images });

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
          imageUri: primaryImage?.uri,
          images,
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
        imageUri: primaryImage?.uri,
        images,
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
  const flowSteps = [
    { id: 1 as FlowStep, title: "Scannen", subtitle: "Foto oder ohne Scan" },
    { id: 2 as FlowStep, title: "Ziel", subtitle: "Keller zuerst" },
    { id: 3 as FlowStep, title: "Prüfen", subtitle: "Ergänzen und speichern" },
  ];
  const targetSummary = {
    cellar: { label: "Weinkeller", detail: "Flaschen einlagern" },
    wishlist: { label: "Merkliste", detail: "Getrunken oder gesehen" },
    shopping: { label: "Einkaufsliste", detail: "Für später einkaufen" },
  } satisfies Record<StorageMode, { label: string; detail: string }>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Wein erfassen</Text>
        <Text style={styles.screenSubtitle}>
          Ein klarer Ablauf: erst optional scannen, dann Ziel wählen, danach prüfen und speichern.
        </Text>

        <MobileFlowStepper steps={flowSteps} currentStep={currentStep} />

        {currentStep === 1 && (
          <>
            <View style={styles.card}>
              <Text style={styles.stepEyebrow}>Schritt 1</Text>
              <Text style={styles.cardTitle}>Wein scannen</Text>
              <Text style={styles.scanHint}>
                Foto aufnehmen oder aus der Mediathek wählen. Bild, Name, Produzent, Jahrgang und mögliche Weindetails werden vorausgefüllt.
              </Text>
              <View style={styles.photoRow}>
                <TouchableOpacity
                  style={[styles.imageBtn, scanBusy && styles.imageBtnDisabled]}
                  onPress={takePhotoForScan}
                  disabled={scanBusy}
                >
                  <Text style={styles.imageBtnText}>{scanBusy ? "Scan läuft…" : "Scan mit Kamera"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageBtn, scanBusy && styles.imageBtnDisabled]}
                  onPress={pickImageForScan}
                  disabled={scanBusy}
                >
                  <Text style={styles.imageBtnText}>{scanBusy ? "Bitte warten" : "Scan aus Mediathek"}</Text>
                </TouchableOpacity>
              </View>
              {scanBusy && (
                <View style={styles.scanBusyRow}>
                  <ActivityIndicator color={WINE_RED} />
                  <Text style={styles.scanBusyText}>Claude analysiert das Etikett und ergänzt die Weindaten.</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.skipTitle}>Kein Foto zur Hand?</Text>
              <Text style={styles.skipHint}>
                Du kannst den Scan überspringen und den Wein manuell erfassen.
              </Text>
              <TouchableOpacity style={styles.secondaryAction} onPress={skipScan}>
                <Text style={styles.secondaryActionText}>Ohne Scan fortfahren</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {currentStep === 2 && (
          <>
            <View style={styles.card}>
              <View style={styles.stepHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepEyebrow}>Schritt 2</Text>
                  <Text style={styles.cardTitle}>Wohin soll dieser Wein?</Text>
                  <Text style={styles.stepBody}>
                    Für euren Hauptfall ist der Weinkeller die klare Standardwahl. Merkliste und Einkaufsliste bleiben bewusst sekundär.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(1)}>
                  <Text style={styles.linkAction}>Scan ändern</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryDestinationCard} onPress={() => selectStorageMode("cellar")}>
              <View style={styles.priorityPillPrimary}>
                <Text style={styles.priorityPillPrimaryText}>Priorität 1a</Text>
              </View>
              <Text style={styles.primaryDestinationTitle}>In den Keller</Text>
              <Text style={styles.primaryDestinationSubtitle}>Flaschen einlagern, Bestand pflegen und später trinken.</Text>
              <Text style={styles.primaryDestinationCta}>Empfohlen</Text>
            </TouchableOpacity>

            <View style={styles.secondaryDestinationGrid}>
              <DestinationOptionCard
                title="Auf die Merkliste"
                subtitle="Für getrunkene, gesehene oder gemerkte Weine"
                priority="Priorität 2"
                onPress={() => selectStorageMode("wishlist")}
              />
              <DestinationOptionCard
                title="Auf die Einkaufsliste"
                subtitle="Für spätere Einkäufe und Einkaufsnotizen"
                priority="Priorität 2"
                onPress={() => selectStorageMode("shopping")}
              />
            </View>
          </>
        )}

        {currentStep === 3 && (
          <>
            <View style={styles.card}>
              <Text style={styles.stepEyebrow}>Schritt 3</Text>
              <Text style={styles.cardTitle}>Angaben prüfen</Text>
              <Text style={styles.stepBody}>
                Jetzt nur noch kontrollieren, ergänzen und speichern.
              </Text>

              <SummaryInfoRow
                label="Scan"
                value={scanDecision === "scanned" ? "Etikett übernommen" : "Ohne Scan gestartet"}
                actionLabel="Ändern"
                onPress={() => setCurrentStep(1)}
              />
              <SummaryInfoRow
                label="Ziel"
                value={targetSummary[storageMode].label}
                actionLabel="Ändern"
                onPress={() => setCurrentStep(2)}
              />
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{targetSummary[storageMode].label}</Text>
                <Text style={styles.summaryHint}>{targetSummary[storageMode].detail}</Text>
              </View>
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
            <View style={styles.grapeBox}>
              <SelectField
                label="Auswahl"
                value={grapeMode}
                onValueChange={(value) => switchGrapeMode(value as GrapeEntryMode)}
                options={[
                  { value: "single", label: "Rebsorte" },
                  { value: "assemblage", label: "Assemblage" },
                  { value: "other", label: "Andere" },
                ]}
                testID="add-wine-grape-mode-select"
              />

              {grapeMode === "single" && (
                <SelectField
                  label="Rebsorte"
                  value={grapeOptions.some((option) => option.value === grape) ? grape : ""}
                  onValueChange={selectSingleGrape}
                  options={[...grapeOptions, { value: OTHER_GRAPE_OPTION, label: "Andere…" }]}
                  placeholder={country ? `Rebsorte aus ${country} wählen` : "Rebsorte wählen"}
                  testID="add-wine-grape-select"
                />
              )}

              {grapeMode === "assemblage" && (
                <>
                  {selectedGrapes.length > 0 && (
                    <View style={styles.grapeChips}>
                      {selectedGrapes.map((entry) => (
                        <TouchableOpacity
                          key={entry}
                          style={styles.grapeChip}
                          onPress={() => removeAssemblageGrape(entry)}
                        >
                          <Text style={styles.grapeChipText}>{entry} ×</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <SelectField
                    label="Traube hinzufügen"
                    value=""
                    onValueChange={addAssemblageGrape}
                    options={assemblageOptions}
                    placeholder={country ? `Traube aus ${country} wählen` : "Traube wählen"}
                    testID="add-wine-assemblage-grape-select"
                  />
                  <View style={styles.grapeOtherRow}>
                    <TextInput
                      style={[styles.input, styles.grapeOtherInput]}
                      value={customAssemblageGrape}
                      onChangeText={setCustomAssemblageGrape}
                      placeholder="Andere Traube"
                    />
                    <TouchableOpacity style={styles.grapeAddButton} onPress={addCustomAssemblageGrape}>
                      <Text style={styles.grapeAddButtonText}>Hinzufügen</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {grapeMode === "other" && (
                <TextInput
                  style={styles.input}
                  value={grape}
                  onChangeText={setGrape}
                  placeholder="Rebsorte manuell eingeben"
                />
              )}
            </View>

            {storageMode === "cellar" && (
              <>
                <Text style={styles.sectionTitle}>Kauf & Keller</Text>
                <Text style={styles.label}>{`Kaufpreis pro Flasche (${currency})`}</Text>
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={(value) => {
                    setPurchasePrice(value);
                    clearError("purchasePrice");
                  }}
                  onBlur={() => setPurchasePrice(normalizeCurrencyInput(purchasePrice, currency))}
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

                <Text style={styles.label}>{`Preis (${currency})`}</Text>
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={(value) => {
                    setPurchasePrice(value);
                    clearError("purchasePrice");
                  }}
                  onBlur={() => setPurchasePrice(normalizeCurrencyInput(purchasePrice, currency))}
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
                <Text style={styles.label}>{`Geschätzter Preis (${currency})`}</Text>
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={(value) => {
                    setPurchasePrice(value);
                    clearError("purchasePrice");
                  }}
                  onBlur={() => setPurchasePrice(normalizeCurrencyInput(purchasePrice, currency))}
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
                <Text style={styles.sectionTitle}>Fotos ({images.length}/3)</Text>
                {images.length > 0 && (
                  <View style={styles.imageGrid}>
                    {images.map((image) => (
                      <View key={image.id} style={styles.imageTile}>
                        <Image source={{ uri: image.uri }} style={styles.tileImage} />
                        <View style={styles.imageActions}>
                          <TouchableOpacity style={[styles.imagePill, image.isPrimary && styles.imagePillActive]} onPress={() => makePrimaryImage(image.id)}>
                            <Text style={[styles.imagePillText, image.isPrimary && styles.imagePillTextActive]}>
                              {image.isPrimary ? "Hauptbild" : "Haupt"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.imagePill} onPress={() => removeImage(image.id)}>
                            <Text style={styles.imagePillText}>Entfernen</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                {images.length < 3 && (
                  <View style={styles.photoRow}>
                    <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
                      <Text style={styles.imageBtnText}>Kamera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                      <Text style={styles.imageBtnText}>Mediathek</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldError({ message, muted = false }: { message?: string; muted?: boolean }) {
  if (!message) return null;
  return <Text style={[styles.fieldError, muted && styles.fieldHint]}>{message}</Text>;
}

function MobileFlowStepper({
  steps,
  currentStep,
}: {
  steps: { id: FlowStep; title: string; subtitle: string }[];
  currentStep: FlowStep;
}) {
  return (
    <View style={styles.stepperCard}>
      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const active = currentStep === step.id;
          const complete = currentStep > step.id;
          return (
            <View key={step.id} style={styles.stepperItem}>
              <View style={[
                styles.stepperBadge,
                (active || complete) && styles.stepperBadgeActive,
              ]}>
                <Text style={[
                  styles.stepperBadgeText,
                  (active || complete) && styles.stepperBadgeTextActive,
                ]}>
                  {complete ? "✓" : step.id}
                </Text>
              </View>
              <Text style={[styles.stepperTitle, active && styles.stepperTitleActive]}>{step.title}</Text>
              <Text style={styles.stepperSubtitle}>{step.subtitle}</Text>
              {index < steps.length - 1 && <View style={styles.stepperLine} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DestinationOptionCard({
  title,
  subtitle,
  priority,
  onPress,
}: {
  title: string;
  subtitle: string;
  priority: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.destinationCard} onPress={onPress}>
      <View style={styles.priorityPillSecondary}>
        <Text style={styles.priorityPillSecondaryText}>{priority}</Text>
      </View>
      <Text style={styles.destinationCardTitle}>{title}</Text>
      <Text style={styles.destinationCardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function SummaryInfoRow({
  label,
  value,
  actionLabel,
  onPress,
}: {
  label: string;
  value: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.linkAction}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#1f1715", marginTop: 4 },
  screenSubtitle: { fontSize: 14, color: "#6f625d", lineHeight: 20, marginBottom: 2 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#efe6e2" },
  stepEyebrow: { fontSize: 12, fontWeight: "800", color: WINE_RED, textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#1f1715", marginTop: 6 },
  stepBody: { fontSize: 14, color: "#6f625d", marginTop: 8, lineHeight: 20 },
  skipTitle: { fontSize: 16, fontWeight: "700", color: "#2b211e" },
  skipHint: { fontSize: 13, color: "#776c67", marginTop: 4, lineHeight: 18 },
  secondaryAction: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d9cfc9",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryActionText: { color: "#2b211e", fontWeight: "700", fontSize: 14 },
  stepHeaderRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  linkAction: { color: WINE_RED, fontWeight: "700", fontSize: 13 },
  stepperCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#efe6e2" },
  stepperRow: { flexDirection: "row", gap: 8 },
  stepperItem: { flex: 1, alignItems: "center", position: "relative" },
  stepperBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#efe9e6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBadgeActive: { backgroundColor: WINE_RED },
  stepperBadgeText: { color: "#7d726d", fontSize: 14, fontWeight: "800" },
  stepperBadgeTextActive: { color: "#fff" },
  stepperTitle: { marginTop: 8, fontSize: 13, fontWeight: "700", color: "#7d726d", textAlign: "center" },
  stepperTitleActive: { color: "#2b211e" },
  stepperSubtitle: { marginTop: 2, fontSize: 10, color: "#9a8f8a", textAlign: "center", lineHeight: 13 },
  stepperLine: {
    position: "absolute",
    top: 18,
    right: "-12%",
    width: "24%",
    height: 1,
    backgroundColor: "#e4dbd6",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: WINE_RED,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  primaryDestinationCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d7b1b1",
    shadowColor: "#8B1A1A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  priorityPillPrimary: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#f4eaea",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  priorityPillPrimaryText: { color: WINE_RED, fontSize: 11, fontWeight: "800" },
  primaryDestinationTitle: { fontSize: 22, fontWeight: "800", color: "#1f1715" },
  primaryDestinationSubtitle: { marginTop: 6, fontSize: 14, lineHeight: 20, color: "#6f625d" },
  primaryDestinationCta: { marginTop: 12, fontSize: 13, fontWeight: "800", color: WINE_RED },
  secondaryDestinationGrid: { gap: 12 },
  destinationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8dfda",
  },
  priorityPillSecondary: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#f5f2f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  priorityPillSecondaryText: { color: "#776c67", fontSize: 11, fontWeight: "800" },
  destinationCardTitle: { fontSize: 18, fontWeight: "800", color: "#2b211e" },
  destinationCardSubtitle: { marginTop: 6, fontSize: 13, lineHeight: 18, color: "#776c67" },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
    backgroundColor: "#f8f5f3",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryLabel: { fontSize: 11, fontWeight: "800", color: "#8f827c", textTransform: "uppercase", letterSpacing: 0.4 },
  summaryValue: { fontSize: 15, fontWeight: "700", color: "#2b211e", marginTop: 2 },
  summaryHint: { fontSize: 12, color: "#776c67", marginTop: 3 },
  summaryBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#f8f5f3",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
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
  grapeBox: { gap: 8 },
  grapeChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  grapeChip: {
    borderRadius: 999,
    backgroundColor: "#f4eaea",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  grapeChipText: { color: WINE_RED, fontSize: 12, fontWeight: "800" },
  grapeOtherRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  grapeOtherInput: { flex: 1 },
  grapeAddButton: {
    alignSelf: "stretch",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: WINE_RED,
    paddingHorizontal: 12,
  },
  grapeAddButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
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
  scanHint: { fontSize: 13, color: "#776c67", marginTop: 8, lineHeight: 20 },
  scanBusyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  scanBusyText: { flex: 1, fontSize: 12, color: "#6f625d" },
  imageGrid: { gap: 10 },
  imageTile: { borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7ded9" },
  tileImage: { width: "100%", height: 190, backgroundColor: "#1a0500" },
  imageActions: { flexDirection: "row", gap: 8, padding: 8 },
  imagePill: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", backgroundColor: "#f4eaea" },
  imagePillActive: { backgroundColor: WINE_RED },
  imagePillText: { color: WINE_RED, fontWeight: "800", fontSize: 12 },
  imagePillTextActive: { color: "#fff" },
  imageBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WINE_RED,
    alignItems: "center",
    backgroundColor: "#fdfbfa",
  },
  imageBtnDisabled: { opacity: 0.6 },
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
