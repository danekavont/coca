import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import { db } from '../lib/firebase';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc
} from 'firebase/firestore';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const OFFSETS = [0, 5, 10, 30];

type TimeReminder = {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  offset: number;
};

type Medication = {
  id?: string;
  name: string;
  days: boolean[];
  reminders: TimeReminder[];
};

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [reminders, setReminders] = useState<TimeReminder[]>([]);
  const [newHour, setNewHour] = useState(8);
  const [newMinute, setNewMinute] = useState(0);
  const [newPeriod, setNewPeriod] = useState<'AM' | 'PM'>('AM');
  const [newOffset, setNewOffset] = useState(0);
  const [saving, setSaving] = useState(false);

  const todayIndex = new Date().getDay();

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    loadMeds();
  }, []);

  const loadMeds = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'medications'));
      const meds: Medication[] = [];
      snapshot.forEach(docSnap => {
        meds.push({ id: docSnap.id, ...(docSnap.data() as Medication) });
      });
      setMedications(meds);
    } catch (error) {
      console.error('Failed to load medications:', error);
    }
  };

  const toggleDay = (index: number) => {
    const updated = [...selectedDays];
    updated[index] = !updated[index];
    setSelectedDays(updated);
  };

  const addReminder = () => {
    const exists = reminders.some(r =>
      r.hour === newHour &&
      r.minute === newMinute &&
      r.period === newPeriod &&
      r.offset === newOffset
    );

    if (exists) {
      Alert.alert('Duplicate', 'This reminder already exists.');
      return;
    }

    setReminders([
      ...reminders,
      { hour: newHour, minute: newMinute, period: newPeriod, offset: newOffset },
    ]);
  };

  const removeReminder = (index: number) => {
    const updated = reminders.filter((_, i) => i !== index);
    setReminders(updated);
  };

  const formatTime = (r: TimeReminder) => {
    const h = r.hour.toString().padStart(2, '0');
    const m = r.minute.toString().padStart(2, '0');
    return `${h}:${m} ${r.period}`;
  };

  const handleSave = async () => {
    console.log('Attempting to save medication with:', { medicineName, selectedDays, reminders });

    if (!medicineName.trim() || reminders.length === 0 || !selectedDays.includes(true)) {
      Alert.alert('Incomplete', 'Please complete all fields (name, days, and at least one reminder).');
      return;
    }

    setSaving(true);

    const med: Medication = {
      name: medicineName.trim(),
      days: [...selectedDays],
      reminders: [...reminders],
    };

    try {
      const updated = [...medications];
      if (editingIndex !== null && medications[editingIndex]?.id) {
        const id = medications[editingIndex].id!;
        await updateDoc(doc(db, 'medications', id), med);
        updated[editingIndex] = { ...med, id };
        console.log('Medication updated:', id);
      } else {
        const docRef = await addDoc(collection(db, 'medications'), med);
        updated.push({ ...med, id: docRef.id });
        console.log('Medication added:', docRef.id);
      }

      setMedications(updated);
      await scheduleMedNotifications(med);
      resetForm();
      Alert.alert('Success', 'Medication saved successfully.');
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'An error occurred while saving the medication.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMedicineName('');
    setSelectedDays([false, false, false, false, false, false, false]);
    setReminders([]);
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleEdit = (index: number) => {
    const med = medications[index];
    setMedicineName(med.name);
    setSelectedDays([...med.days]);
    setReminders([...med.reminders]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = async (index: number) => {
    try {
      if (medications[index]?.id) {
        await deleteDoc(doc(db, 'medications', medications[index].id!));
      }
      const updated = [...medications];
      updated.splice(index, 1);
      setMedications(updated);
    } catch (error) {
      console.error('Failed to delete medication:', error);
      Alert.alert('Error', 'Unable to delete medication.');
    }
  };

  const scheduleMedNotifications = async (med: Medication) => {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const index = (today.getDay() + i) % 7;
      if (med.days[index]) {
        const baseDate = new Date();
        baseDate.setDate(today.getDate() + i);

        for (const r of med.reminders) {
          let h = r.period === 'PM' && r.hour < 12 ? r.hour + 12 : r.hour;
          if (r.period === 'AM' && h === 12) h = 0;

          const triggerDate = new Date(baseDate);
          triggerDate.setHours(h);
          triggerDate.setMinutes(r.minute - r.offset);
          triggerDate.setSeconds(0);

          const delaySeconds = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
          if (delaySeconds > 0) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Take ${med.name}`,
                body: r.offset ? `${r.offset} mins from now` : 'Right on time!',
                sound: true,
              },
              trigger: {
                type: 'date',
                date: triggerDate,
              } as Notifications.DateTriggerInput,
            });
          }
        }
      }
    }
  };

  const medsForToday = medications.filter(m => m.days[todayIndex]);

  return (
    <View style={styles.container}>
      <Button title={showForm ? 'Cancel' : 'Add Medication'} onPress={() => setShowForm(!showForm)} />

      {!showForm ? (
        <>
          <Text style={styles.heading}>Today’s Medications</Text>
          {medsForToday.length === 0 ? (
            <Text style={{ marginTop: 10, color: '#777' }}>No medications scheduled for today.</Text>
          ) : (
            <FlatList
              data={medsForToday}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.medItem}>
                  <Text style={styles.medName}>{item.name}</Text>
                  {item.reminders.map((r, i) => (
                    <Text key={i} style={styles.timeText}>
                      {formatTime(r)} — {r.offset === 0 ? 'At time' : `${r.offset} mins before`}
                    </Text>
                  ))}
                  <View style={styles.actionRow}>
                    <Button title="Edit" onPress={() => handleEdit(index)} />
                    <Button title="Delete" onPress={() => handleDelete(index)} />
                  </View>
                </View>
              )}
            />
          )}
        </>
      ) : (
        <>
          <Text style={styles.heading}>Add Medication</Text>
          <TextInput style={styles.input} placeholder="Medicine Name" value={medicineName} onChangeText={setMedicineName} />
          <Text style={styles.subheading}>Select Days</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => toggleDay(i)}
                style={[styles.dayButton, selectedDays[i] && styles.daySelected]}>
                <Text style={selectedDays[i] ? styles.dayTextSelected : styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subheading}>Reminders</Text>
          <FlatList
            data={reminders}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.reminderRow}>
                <Text>{formatTime(item)} — {item.offset} mins before</Text>
                <Button title="Remove" onPress={() => removeReminder(index)} />
              </View>
            )}
            ListEmptyComponent={<Text>No reminders yet</Text>}
          />

          <View style={styles.dropdownRow}>
            <Picker selectedValue={newHour} style={styles.picker} onValueChange={setNewHour}>
              {[...Array(12)].map((_, i) => <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />)}
            </Picker>
            <Picker selectedValue={newMinute} style={styles.picker} onValueChange={setNewMinute}>
              {[...Array(12)].map((_, i) => <Picker.Item key={i} label={`${i * 5}`} value={i * 5} />)}
            </Picker>
            <Picker selectedValue={newPeriod} style={styles.picker} onValueChange={setNewPeriod}>
              <Picker.Item label="AM" value="AM" />
              <Picker.Item label="PM" value="PM" />
            </Picker>
          </View>

          <View style={styles.offsetRow}>
            {OFFSETS.map((offset) => (
              <TouchableOpacity
                key={offset}
                style={[styles.offsetButton, newOffset === offset && styles.offsetSelected]}
                onPress={() => setNewOffset(offset)}
              >
                <Text style={newOffset === offset ? styles.offsetTextSelected : styles.offsetText}>
                  {offset === 0 ? 'At time' : `${offset} mins before`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Add Reminder" onPress={addReminder} />
          <View style={{ marginTop: 16 }}>
            <Button title="Save Medication" onPress={handleSave} disabled={saving} />
            {saving && (
              <Text style={{ marginTop: 8, color: '#007AFF', textAlign: 'center' }}>Saving...</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '600', marginVertical: 12 },
  subheading: { marginTop: 14, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 10,
  },
  daysRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10,
  },
  dayButton: {
    borderWidth: 1, borderColor: '#aaa', borderRadius: 4, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  daySelected: {
    backgroundColor: '#007AFF', borderColor: '#007AFF',
  },
  dayText: { color: '#333', fontWeight: '500' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  offsetRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  offsetButton: {
    borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 6,
  },
  offsetSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  offsetText: { color: '#333' },
  offsetTextSelected: { color: '#fff' },
  reminderRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6, alignItems: 'center',
  },
  dropdownRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12,
  },
  picker: { flex: 1, marginHorizontal: 4 },
  medItem: {
    backgroundColor: '#f2f2f2', borderRadius: 6, padding: 12, marginVertical: 6,
  },
  medName: { fontSize: 16, fontWeight: '600' },
  timeText: { color: '#555', fontSize: 14 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
