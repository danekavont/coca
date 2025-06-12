import { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        Alert.alert("Success", `Welcome, ${userData.email}`);
      } else {
        Alert.alert("Success", "Logged in, but no user data found.");
      }
      console.log("User data:", userDoc.data(), "User ID:", userCredential.user.uid);
      router.replace("/"); // Redirect to landing page
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button title="Login" onPress={handleLogin} />
          <Button title="No account? Register" onPress={() => router.push("/register")} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16, gap: 12 },
  input: { borderWidth: 1, padding: 10, marginBottom: 12, borderRadius: 4 },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
});
