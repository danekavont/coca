import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

export default function AppointmentsScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [formMode, setFormMode] = useState<'none' | 'appointment' | 'medication'>('none');

  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [location, setLocation] = useState('');
  const [withPerson, setWithPerson] = useState('');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [repeatFrom, setRepeatFrom] = useState('');
  const [repeatTo, setRepeatTo] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [times, setTimes] = useState([{ hour: '09', minute: '00', period: 'AM' }]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const userId = auth.currentUser?.uid;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addTime = () => {
    setTimes([...times, { hour: '09', minute: '00', period: 'AM' }]);
  };

  const removeTime = (index: number) => {
    const newTimes = [...times];
    newTimes.splice(index, 1);
    setTimes(newTimes);
  };

  const updateTime = (index: number, key: 'hour' | 'minute' | 'period', value: string) => {
    const newTimes = [...times];
    newTimes[index][key] = value;
    setTimes(newTimes);
  };

  const get24Hour = ({ hour, minute, period }: any) => {
    let hr = parseInt(hour);
    if (period === 'PM' && hr < 12) hr += 12;
    if (period === 'AM' && hr === 12) hr = 0;
    return `${hr.toString().padStart(2, '0')}:${minute}`;
  };

  useEffect(() => {
    if (!userId) return;

    const apptRef = query(collection(db, 'appointments'), where('userId', '==', userId));
    const medRef = query(collection(db, 'medications'), where('userId', '==', userId));

    const unsubscribeAppt = onSnapshot(apptRef, (snapshot) => {
      setAppointments(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time.toDate(),
      })));
    });

    const unsubscribeMed = onSnapshot(medRef, (snapshot) => {
      setMedications(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time.toDate(),
      })));
    });

    return () => {
      unsubscribeAppt();
      unsubscribeMed();
    };
  }, [userId]);

  const handleSave = async () => {
    if (!selectedDate || (!title && !name)) {
      Alert.alert('Missing Info', 'Please complete the form.');
      return;
    }

    const base = { userId };

    try {
      if (formMode === 'appointment') {
        const hr = parseInt(times[0].hour);
        const minute = times[0].minute;
        const period = times[0].period;
        const hr24 = period === 'PM' && hr < 12 ? hr + 12 : period === 'AM' && hr === 12 ? 0 : hr;
        const time = Timestamp.fromDate(new Date(`${selectedDate}T${hr24.toString().padStart(2, '0')}:${minute}`));

        const data = {
          ...base,
          date: selectedDate,
          time,
          title,
          agenda,
          location,
          meetingWith: withPerson,
          attended: false,
        };
        if (editingId) {
          await updateDoc(doc(db, 'appointments', editingId), data);
        } else {
          await addDoc(collection(db, 'appointments'), data);
        }
      } else if (formMode === 'medication') {
        const data = {
          ...base,
          name,
          dosage,
          frequency,
          taken: false,
          repeatFrom,
          repeatTo,
        };

        const from = new Date(repeatFrom || selectedDate);
        const to = new Date(repeatTo || selectedDate);

        while (from <= to) {
          const dayIdx = from.getDay().toString();
          if (selectedDays.includes(dayIdx)) {
            const dateStr = from.toISOString().split('T')[0];
            for (const t of times) {
              const timeStr = get24Hour(t);
              const time = Timestamp.fromDate(new Date(`${dateStr}T${timeStr}`));
              const entry = { ...data, date: dateStr, time };
              await addDoc(collection(db, 'medications'), entry);
            }
          }
          from.setDate(from.getDate() + 1);
        }
      }

      resetForm();
      Alert.alert('Success', 'Saved successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Saving failed.');
    }
  };

  const resetForm = () => {
    setFormMode('none');
    setTitle('');
    setAgenda('');
    setLocation('');
    setWithPerson('');
    setName('');
    setDosage('');
    setFrequency('');
    setRepeatFrom('');
    setRepeatTo('');
    setSelectedDays([]);
    setTimes([{ hour: '09', minute: '00', period: 'AM' }]);
    setEditingId(null);
  };

  const toggleAttended = async (item: any) => {
    if (!item.id) return;
    await updateDoc(doc(db, 'appointments', item.id), {
      attended: !item.attended,
    });
  };

  const toggleTaken = async (item: any) => {
    if (!item.id) return;
    await updateDoc(doc(db, 'medications', item.id), {
      taken: !item.taken,
    });
  };

  const deleteItem = (type: 'appointment' | 'medication', id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const path = type === 'appointment' ? 'appointments' : 'medications';
          await deleteDoc(doc(db, path, id));
        },
      },
    ]);
  };

  const filteredAppointments = appointments.filter((a) => a.date === selectedDate);
  const filteredMedications = medications.filter((m) => m.date === selectedDate);

  const getMarkedDates = () => {
    const marks: any = {};
    [...appointments, ...medications].forEach((item) => {
      marks[item.date] = {
        marked: true,
        dotColor: '#007AFF',
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: '#007AFF',
      };
    }

    return marks;
  };

  const generatePickerItems = (max: number) =>
    Array.from({ length: max }, (_, i) => {
      const val = i.toString().padStart(2, '0');
      return <Picker.Item key={val} label={val} value={val} />;
    });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Appointments & Medications</Text>

      <Calendar
        onDayPress={(day: DateData) => {
          setSelectedDate(day.dateString);
          resetForm();
        }}
        markedDates={getMarkedDates()}
        markingType="dot"
      />

      {selectedDate ? (
        <>
          <Text style={styles.sectionTitle}>Appointments on {selectedDate}</Text>
          {filteredAppointments.map((item) => (
            <View key={item.id} style={[styles.itemBox, { borderLeftColor: item.attended ? 'green' : 'red' }]}>
              <Text
                style={styles.itemText}
                onPress={() => {
                  setTitle(item.title);
                  setAgenda(item.agenda || '');
                  setLocation(item.location || '');
                  setWithPerson(item.meetingWith || '');
                  const time = item.time;
                  const hr = time.getHours();
                  setTimes([{
                    hour: (hr % 12 || 12).toString().padStart(2, '0'),
                    minute: time.getMinutes().toString().padStart(2, '0'),
                    period: hr >= 12 ? 'PM' : 'AM'
                  }]);
                  setFormMode('appointment');
                  setEditingId(item.id);
                }}
              >
                📅 {item.title} — {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.agenda && <Text style={styles.subText}>📝 Agenda: {item.agenda}</Text>}
              {item.location && <Text style={styles.subText}>📍 Location: {item.location}</Text>}
              {item.meetingWith && <Text style={styles.subText}>🤝 With: {item.meetingWith}</Text>}
              <TouchableOpacity onPress={() => toggleAttended(item)}>
                <Text style={[styles.statusText, { color: item.attended ? 'green' : 'red' }]}>
                  {item.attended ? 'Attended (tap to undo)' : 'Not Attended (tap to confirm)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteItem('appointment', item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Medications on {selectedDate}</Text>
          {filteredMedications.map((item) => (
            <View key={item.id} style={[styles.itemBox, { borderLeftColor: item.taken ? 'green' : 'red' }]}>
              <Text style={styles.itemText}>
                💊 {item.name} ({item.dosage}) — {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.frequency && <Text style={styles.subText}>⏱ Frequency: {item.frequency}</Text>}
              {item.repeatFrom && item.repeatTo && (
                <Text style={styles.subText}>🔁 Repeats: {item.repeatFrom} → {item.repeatTo}</Text>
              )}
              <TouchableOpacity onPress={() => toggleTaken(item)}>
                <Text style={[styles.statusText, { color: item.taken ? 'green' : 'red' }]}>
                  {item.taken ? 'Taken (tap to undo)' : 'Not Taken (tap to confirm)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteItem('medication', item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}

          {formMode === 'none' && (
            <View style={{ marginVertical: 10 }}>
              <Button title="Add Appointment" onPress={() => setFormMode('appointment')} />
              <View style={{ height: 6 }} />
              <Button title="Add Medication" onPress={() => setFormMode('medication')} />
            </View>
          )}
        </>
      ) : (
        <Text style={{ color: '#999', marginTop: 12 }}>Select a date to view data.</Text>
      )}

      {formMode !== 'none' && (
        <View style={styles.form}>
          {formMode === 'appointment' ? (
            <>
              <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
              <TextInput style={styles.input} placeholder="Agenda" value={agenda} onChangeText={setAgenda} />
              <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
              <TextInput style={styles.input} placeholder="Meeting With" value={withPerson} onChangeText={setWithPerson} />
              
            </>
          ) : (
            <>
              <TextInput style={styles.input} placeholder="Medicine Name" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Dosage" value={dosage} onChangeText={setDosage} />
              <TextInput style={styles.input} placeholder="Frequency" value={frequency} onChangeText={setFrequency} />
              <TextInput style={styles.input} placeholder="Repeat From (YYYY-MM-DD)" value={repeatFrom} onChangeText={setRepeatFrom} />
              <TextInput style={styles.input} placeholder="Repeat To (YYYY-MM-DD)" value={repeatTo} onChangeText={setRepeatTo} />

              <Text style={{ marginTop: 10 }}>Repeat on:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => toggleDay(idx.toString())}
                    style={{
                      padding: 8,
                      backgroundColor: selectedDays.includes(idx.toString()) ? '#007AFF' : '#ccc',
                      borderRadius: 6,
                      margin: 2,
                      width: 36,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white' }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={{ marginTop: 10 }}>Select Times:</Text>
          {times.map((t, index) => (
            <View key={index} style={styles.pickerRow}>
              <Picker selectedValue={t.hour} style={styles.picker} onValueChange={(val) => updateTime(index, 'hour', val)}>
                {generatePickerItems(12)}
              </Picker>
              <Text style={styles.colon}>:</Text>
              <Picker selectedValue={t.minute} style={styles.picker} onValueChange={(val) => updateTime(index, 'minute', val)}>
                {generatePickerItems(60)}
              </Picker>
              <Picker selectedValue={t.period} style={[styles.picker, { width: 100 }]} onValueChange={(val) => updateTime(index, 'period', val)}>
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
              {times.length > 1 && (
                <TouchableOpacity onPress={() => removeTime(index)}>
                  <Text style={{ marginLeft: 6, color: 'red' }}>🗑</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <Button title="Add Time" onPress={addTime} />
          <Button title={editingId ? 'Update' : 'Save'} onPress={handleSave} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 14 },
  itemBox: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 6, marginTop: 6, borderLeftWidth: 4 },
  itemText: { fontSize: 15, fontWeight: 'bold' },
  subText: { fontSize: 13, color: '#333', marginTop: 2 },
  statusText: { fontSize: 13, fontStyle: 'italic', textDecorationLine: 'underline', marginTop: 4, textAlign: 'right' },
  deleteText: { color: 'red', marginTop: 4, textAlign: 'right', textDecorationLine: 'underline' },
  form: { marginTop: 12, gap: 10, backgroundColor: '#fefefe', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginTop: 6, fontSize: 14 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  picker: { flex: 1, height: 50 },
  colon: { fontSize: 20, marginHorizontal: 8 },
});
