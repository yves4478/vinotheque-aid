import { StyleSheet, Text, View } from "react-native";

export function FeatureUnavailableCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Feature geparkt</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c2410c",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7c2d12",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#9a3412",
  },
});
