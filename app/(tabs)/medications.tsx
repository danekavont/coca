import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  TouchableOpacity, FlatList, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Medication = {
  name: string;
  dosage: string;
  days: boolean[];
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
};

export default function SimpleReminderScreen() {
  const [showForm, setShowForm] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [medications, setMedications] = useState<Medication[]>([]);

  const toggleDay = (index: number) => {
    const updated = [...selectedDays];
    updated[index] = !updated[index];
    setSelectedDays(updated);
  };

  const formatTime = (h: number, m: number, p: 'AM' | 'PM') =>
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${p}`;

  const handleAdd = () => {
    if (!medicineName.trim() || !dosage.trim() || !selectedDays.includes(true)) {
      Alert.alert('Incomplete', 'Please enter a name, dosage, and select at least one day.');
      return;
    }

    setMedications([
      ...medications,
      {
        name: medicineName.trim(),
        dosage: dosage.trim(),
        days: [...selectedDays],
        hour,
        minute,
        period,
      },
    ]);

    setMedicineName('');
    setDosage('');
    setSelectedDays([false, false, false, false, false, false, false]);
    setHour(8);
    setMinute(0);
    setPeriod('AM');
    setShowForm(false);
  };

  const handleDelete = (index: number) => {
    const updated = [...medications];
    updated.splice(index, 1);
    setMedications(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medication Reminders</Text>

      <Button title={showForm ? 'Cancel' : 'Add Medication'} onPress={() => setShowForm(!showForm)} />

      {showForm ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Medicine Name"
            value={medicineName}
            onChangeText={setMedicineName}
          />
          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g. 1 tablet, 5ml)"
            value={dosage}
            onChangeText={setDosage}
          />

          <Text style={styles.subheading}>Days to Take</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayButton, selectedDays[i] && styles.daySelected]}
                onPress={() => toggleDay(i)}>
                <Text style={selectedDays[i] ? styles.dayTextSelected : styles.dayText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subheading}>Time</Text>
          <View style={styles.timeRow}>
            <Picker selectedValue={hour} style={styles.picker} onValueChange={(value) => setHour(value)}>
              {[...Array(12)].map((_, i) => (
                <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
              ))}
            </Picker>
            <Picker selectedValue={minute} style={styles.picker} onValueChange={(value) => setMinute(value)}>
              {[0, 5, 10, 15, 30, 45].map((m) => (
                <Picker.Item key={m} label={`${m}`} value={m} />
              ))}
            </Picker>
            <Picker selectedValue={period} style={styles.picker} onValueChange={(value) => setPeriod(value)}>
              <Picker.Item label="AM" value="AM" />
              <Picker.Item label="PM" value="PM" />
            </Picker>
          </View>

          <Button title="Save Medication" onPress={handleAdd} />
        </>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.medItem}>
              <Text style={styles.medName}>{item.name}</Text>
              <Text>Dosage: {item.dosage}</Text>
              <Text>Days: {item.days.map((d, i) => (d ? DAYS[i] : '')).join(' ')}</Text>
              <Text>Time: {formatTime(item.hour, item.minute, item.period)}</Text>
              <Button title="Delete" onPress={() => handleDelete(index)} />
            </View>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 16 }}>No medications added.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12,
  },
  subheading: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  daysRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10,
  },
  dayButton: {
    borderWidth: 1, borderColor: '#aaa', borderRadius: 4, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  daySelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  dayText: { color: '#333', fontWeight: '500' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  timeRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12,
  },
  picker: { flex: 1, marginHorizontal: 4 },
  medItem: {
    backgroundColor: '#f2f2f2', padding: 12, borderRadius: 6, marginVertical: 6,
  },
  medName: { fontSize: 16, fontWeight: '600' },
});
