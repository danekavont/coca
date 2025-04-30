import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MedicationsTab() {
  const [medName, setMedName] = useState("");
  const [medList, setMedList] = useState<string[]>([]);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    const data = await AsyncStorage.getItem("medications");
    if (data) setMedList(JSON.parse(data));
  };

  const addMedication = async () => {
    if (!medName.trim()) return;
    const updatedList = [...medList, medName.trim()];
    setMedList(updatedList);
    setMedName("");
    await AsyncStorage.setItem("medications", JSON.stringify(updatedList));
    Alert.alert("Saved", "Medication added.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Medications</Text>
      <TextInput
        placeholder="Enter medication name"
        value={medName}
        onChangeText={setMedName}
        style={styles.input}
      />
      <Button title="Add Medication" onPress={addMedication} />
      <FlatList
        data={medList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.medItem}>• {item}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 10,
    borderRadius: 4,
  },
  medItem: {
    fontSize: 18,
    marginVertical: 4,
  },
});
