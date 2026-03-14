import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const features = [
  {
    title: "Report Civic Issues",
    description:
      "Capture potholes, streetlight failures, waste, or traffic violations in a few taps.",
  },
  {
    title: "Track Every Update",
    description:
      "Follow issue progress from submission to resolution with clear public status updates.",
  },
  {
    title: "Transparent Accountability",
    description:
      "Civic Lens keeps a verifiable history so actions cannot be silently hidden or deleted.",
  },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Image
            source={require("./assets/civic-lens-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>Civic Lens</Text>
          <Text style={styles.tagline}>Empowering Communities</Text>
          <Text style={styles.description}>
            A citizen-first platform to report local issues, track solutions, and build
            trust through transparent governance.
          </Text>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Report an Issue</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Civic Lens</Text>
          {features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF3FB",
  },
  container: {
    padding: 20,
    gap: 20,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#D3E1F7",
    shadowColor: "#0A2C63",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
    alignItems: "center",
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0A2C63",
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: "#2B4D84",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  description: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#334155",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#155EEF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#102A56",
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9E3F4",
    padding: 16,
    gap: 8,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#173A74",
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
});
