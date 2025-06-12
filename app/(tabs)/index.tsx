import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator, Button, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { router } from "expo-router";

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        router.replace("/login");
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.section}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={[styles.section, { backgroundColor: '#f5f5f5'}]}>
        <ThemedText type="title">
          {user ? `Welcome to CoCa, ${user.email}` : "Welcome to CoCa"}
        </ThemedText>
        <Button title="Logout" onPress={handleLogout} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: '#000',
    gap: 8,
    marginBottom: 20,
  },
  section: {
    gap: 6,
    backgroundColor: '#000',
  },
});
