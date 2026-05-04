import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  addGrapeToSelection,
  getAssemblageRequirementText,
  getGrapesForCountry,
  getInitialGrapeEntryMode,
  OTHER_GRAPE_OPTION,
  parseGrapeList,
  removeGrapeFromSelection,
  type GrapeEntryMode,
} from "@vinotheque/core";
import { SelectField } from "@/components/ui/SelectField";

interface GrapeSelectorFieldProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  testIDPrefix?: string;
}

export function GrapeSelectorField({
  country,
  value,
  onChange,
  label = "Traube(n)",
  testIDPrefix,
}: GrapeSelectorFieldProps) {
  const [mode, setMode] = useState<GrapeEntryMode>("single");
  const [customAssemblageGrape, setCustomAssemblageGrape] = useState("");
  const grapeOptions = useMemo(
    () => getGrapesForCountry(country).map((entry) => ({ value: entry, label: entry })),
    [country],
  );
  const selectedGrapes = useMemo(() => parseGrapeList(value), [value]);
  const assemblageOptions = useMemo(
    () => grapeOptions.filter((option) => !selectedGrapes.includes(option.value)),
    [grapeOptions, selectedGrapes],
  );
  const assemblageHint = mode === "assemblage" ? getAssemblageRequirementText(value) : undefined;

  useEffect(() => {
    const inferred = getInitialGrapeEntryMode(value, grapeOptions.map((option) => option.value));
    if (inferred === "assemblage") setMode("assemblage");
    if (inferred === "other" && mode !== "assemblage") setMode("other");
    if (inferred === "single" && mode !== "assemblage" && mode !== "other") setMode("single");
  }, [grapeOptions, mode, value]);

  function switchMode(nextMode: GrapeEntryMode) {
    setMode(nextMode);
    setCustomAssemblageGrape("");
    onChange("");
  }

  function selectSingleGrape(nextValue: string) {
    if (nextValue === OTHER_GRAPE_OPTION) {
      switchMode("other");
      return;
    }
    onChange(nextValue);
  }

  function addAssemblageGrape(nextValue: string) {
    onChange(addGrapeToSelection(value, nextValue));
  }

  function addCustomAssemblageGrape() {
    const custom = customAssemblageGrape.trim();
    if (!custom) return;
    onChange(addGrapeToSelection(value, custom));
    setCustomAssemblageGrape("");
  }

  function removeAssemblageGrape(nextValue: string) {
    onChange(removeGrapeFromSelection(value, nextValue));
  }

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        <SelectField
          label="Auswahl"
          value={mode}
          onValueChange={(nextValue) => switchMode(nextValue as GrapeEntryMode)}
          options={[
            { value: "single", label: "Rebsorte" },
            { value: "assemblage", label: "Assemblage" },
            { value: "other", label: "Andere" },
          ]}
          testID={testIDPrefix ? `${testIDPrefix}-grape-mode-select` : undefined}
        />

        {mode === "single" && (
          <SelectField
            label="Rebsorte"
            value={grapeOptions.some((option) => option.value === value) ? value : ""}
            onValueChange={selectSingleGrape}
            options={[...grapeOptions, { value: OTHER_GRAPE_OPTION, label: "Andere..." }]}
            placeholder={country ? `Rebsorte aus ${country} wählen` : "Rebsorte wählen"}
            testID={testIDPrefix ? `${testIDPrefix}-grape-select` : undefined}
          />
        )}

        {mode === "assemblage" && (
          <>
            {selectedGrapes.length > 0 && (
              <View style={styles.chips}>
                {selectedGrapes.map((entry) => (
                  <TouchableOpacity
                    key={entry}
                    style={styles.chip}
                    onPress={() => removeAssemblageGrape(entry)}
                  >
                    <Text style={styles.chipText}>{entry} ×</Text>
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
              testID={testIDPrefix ? `${testIDPrefix}-assemblage-grape-select` : undefined}
            />
            <View style={styles.otherRow}>
              <TextInput
                style={[styles.input, styles.otherInput]}
                value={customAssemblageGrape}
                onChangeText={setCustomAssemblageGrape}
                placeholder="Andere Traube"
              />
              <TouchableOpacity style={styles.addButton} onPress={addCustomAssemblageGrape}>
                <Text style={styles.addButtonText}>Hinzufügen</Text>
              </TouchableOpacity>
            </View>
            {assemblageHint && <Text style={styles.hint}>{assemblageHint}</Text>}
          </>
        )}

        {mode === "other" && (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="Rebsorte manuell eingeben"
          />
        )}
      </View>
    </View>
  );
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  root: { gap: 8 },
  label: { fontSize: 14, color: "#6f625d", fontWeight: "700" },
  box: { gap: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
    fontSize: 15,
    color: "#1a0500",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#f4e8e6", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: WINE_RED, fontWeight: "700" },
  otherRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  otherInput: { flex: 1 },
  addButton: { backgroundColor: WINE_RED, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  addButtonText: { color: "#fff", fontWeight: "700" },
  hint: { color: "#9a5b00", fontSize: 12, fontWeight: "600" },
});
