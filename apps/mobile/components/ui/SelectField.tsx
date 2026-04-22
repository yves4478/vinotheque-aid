import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface SelectOption {
  value: string;
  label: string;
  detail?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  testID?: string;
}

export function SelectField({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Auswählen",
  disabled = false,
  testID,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  function select(value: string) {
    onValueChange(value);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        activeOpacity={disabled ? 1 : 0.75}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueWrap}>
          <Text
            style={[styles.value, !selected && styles.placeholder, disabled && styles.valueDisabled]}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
          <Text style={[styles.chevron, disabled && styles.valueDisabled]}>⌄</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>Schliessen</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionList} contentContainerStyle={styles.optionContent}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => select(option.value)}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                        {option.label}
                      </Text>
                      {option.detail && <Text style={styles.optionDetail}>{option.detail}</Text>}
                    </View>
                    {active && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  field: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  fieldDisabled: { opacity: 0.55 },
  label: { fontSize: 12, fontWeight: "700", color: "#6f625d", marginBottom: 4 },
  valueWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { flex: 1, fontSize: 15, color: "#1a0500", fontWeight: "600" },
  placeholder: { color: "#9a8f8a", fontWeight: "500" },
  valueDisabled: { color: "#a8a09c" },
  chevron: { color: WINE_RED, fontSize: 18, lineHeight: 18 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    maxHeight: "76%",
    backgroundColor: "#faf8f5",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ded9",
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: "#1a0500" },
  closeButton: { paddingVertical: 6, paddingHorizontal: 4 },
  closeText: { color: WINE_RED, fontWeight: "700" },
  optionList: { backgroundColor: "#fff" },
  optionContent: { paddingVertical: 6 },
  option: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionActive: { backgroundColor: "#f4eaea" },
  optionTextWrap: { flex: 1 },
  optionLabel: { fontSize: 15, color: "#2b211e", fontWeight: "600" },
  optionLabelActive: { color: WINE_RED },
  optionDetail: { color: "#8b807b", marginTop: 2, fontSize: 12 },
  check: { color: WINE_RED, fontSize: 18, fontWeight: "800" },
});
