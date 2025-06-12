import { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { router } from "expo-router";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Account created!");
      router.replace("/login");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Register</Text>
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
          <Button title="Register" onPress={handleRegister} />
          <Button title="Back to Login" onPress={() => router.replace("/login")} />
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
